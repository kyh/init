/**
 * Records the og:video clip (public/og/og.mp4) and its poster (public/og.jpg).
 *
 *   pnpm -F @repo/web og:video
 *
 * Renders scene.tsx with @repo/ui's own CSS into a standalone page, steps the
 * timeline one frame per screenshot in headless Chromium at devicePixelRatio 2,
 * and has ffmpeg downscale and encode the frames. Needs no running app or
 * database; needs ffmpeg on PATH and a Chromium for playwright-core
 * (`npx playwright install chromium`). Not part of verify or build.
 */
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import tailwind from "@tailwindcss/postcss";
import { chromium } from "playwright-core";
import postcss from "postcss";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { siteConfig } from "../../src/lib/site-config";
import { DURATION, FPS, POSTER_TIME, applyFrame } from "./timeline";

const scriptDir = import.meta.dirname;
const publicDir = path.resolve(scriptDir, "../../public");
const WIDTH = 1200;
const HEIGHT = 630;

const renderScene = async () => {
  // @repo/ui compiles its JSX with the classic runtime, which reads a global React.
  Object.assign(globalThis, { React });
  const { COMMAND, Scene } = await import("./scene");

  const markup = renderToStaticMarkup(
    <Scene copy={{ description: siteConfig.description, name: siteConfig.name }} />,
  );
  const css = await postcss([tailwind({ base: scriptDir })]).process(
    `@import "@repo/ui/globals.css";\n@source "./scene.tsx";\n`,
    { from: path.join(scriptDir, "scene.css") },
  );

  const html = `<!doctype html><html lang="en" class="dark"><head><meta charset="utf-8"><style>${css.css}</style><style>html,body{margin:0;background:var(--background)}</style></head><body>${markup}</body></html>`;
  return { command: COMMAND, html };
};

/** Lanczos-downscales the 2x frames to the clip's size. */
const ffmpeg = (args: string[]) =>
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
const downscale = `scale=${WIDTH}:${HEIGHT}:flags=lanczos`;

const main = async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), "og-video-"));
  const framesDir = path.join(workDir, "frames");
  await mkdir(framesDir);
  await mkdir(path.join(publicDir, "og"), { recursive: true });

  const { command, html } = await renderScene();
  const scenePath = path.join(workDir, "scene.html");
  await writeFile(scenePath, html);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      deviceScaleFactor: 2,
      viewport: { height: HEIGHT, width: WIDTH },
    });
    // tsx keeps function names with an `__name` helper the page does not have.
    await page.addInitScript("globalThis.__name = (target) => target;");
    await page.goto(`file://${scenePath}`);
    await page.evaluate(() => document.fonts.ready);

    const frameCount = DURATION * FPS;
    for (let frame = 0; frame < frameCount; frame += 1) {
      await page.evaluate(applyFrame, { command, t: frame / FPS });
      const name = String(frame).padStart(4, "0");
      await page.screenshot({ path: path.join(framesDir, `${name}.png`) });
    }

    await page.evaluate(applyFrame, { command, t: POSTER_TIME });
    await page.screenshot({ path: path.join(workDir, "poster.png") });
  } finally {
    await browser.close();
  }

  const output = path.join(publicDir, "og", "og.mp4");
  ffmpeg(
    [
      ["-framerate", String(FPS), "-i", path.join(framesDir, "%04d.png"), "-vf", downscale],
      ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-crf", "28"],
      ["-movflags", "+faststart", "-an", output],
    ].flat(),
  );
  ffmpeg(
    [
      ["-i", path.join(workDir, "poster.png"), "-vf", downscale],
      ["-q:v", "3", path.join(publicDir, "og.jpg")],
    ].flat(),
  );
  await rm(workDir, { force: true, recursive: true });
  console.log(`Wrote ${path.relative(process.cwd(), output)} and public/og.jpg`);
};

await main();
