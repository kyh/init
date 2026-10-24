/**
 * Captures the og:video clip (public/og/og.mp4) and its poster (public/og.jpg).
 *
 *   pnpm dev:web                       # a seeded app: pnpm bootstrap --yes
 *   pnpm -F @repo/web og:video         # OG_URL=http://localhost:3107 for another port
 *
 * It signs in with the seeded login, screenshots the real dashboard and home page,
 * renders scene.tsx around them with @repo/ui's own CSS, then steps the timeline
 * frame by frame in headless Chromium and encodes the frames with ffmpeg. Needs
 * ffmpeg on PATH and a Chromium for playwright-core (`npx playwright install chromium`).
 * Not part of verify or build.
 */
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import tailwind from "@tailwindcss/postcss";
import { chromium } from "playwright-core";
import type { BrowserContext, Page } from "playwright-core";
import postcss from "postcss";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { z } from "zod";

import { DURATION, FPS, POSTER_TIME, applyFrame } from "./timeline";

const BASE_URL = (process.env.OG_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`).replace(
  /\/$/u,
  "",
);
const EMAIL = "dev@init.local";
const PASSWORD = "password";

const scriptDir = import.meta.dirname;
const publicDir = path.resolve(scriptDir, "../../public");

const SessionSchema = z.object({ user: z.object({ name: z.string() }) });
const TodosSchema = z.object({
  json: z.object({
    todos: z.array(z.object({ completed: z.boolean(), title: z.string() })),
  }),
});

/** Dev-only overlays (Next's indicator, React Query's devtools) are not the app. */
const hideDevOverlays = (page: Page) =>
  page.addStyleTag({
    content: "nextjs-portal, .tsqd-parent-container { display: none !important; }",
  });

/** `ready` is text that shows once the route's data has streamed in. */
const screenshot = async (context: BrowserContext, route: string, ready: string, file: string) => {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}${route}`, { timeout: 120_000 });
  await page.getByText(ready).first().waitFor({ timeout: 60_000 });
  await hideDevOverlays(page);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: file });
  const { pathname } = new URL(page.url());
  await page.close();
  return pathname;
};

const captureApp = async (context: BrowserContext, outDir: string) => {
  const signIn = await context.request.post(`${BASE_URL}/api/auth/sign-in/email`, {
    data: { email: EMAIL, password: PASSWORD },
    headers: { origin: BASE_URL },
  });
  if (!signIn.ok()) {
    throw new Error(`Seeded sign-in failed (HTTP ${signIn.status()}); run pnpm db:seed.`);
  }
  const sessionResponse = await context.request.get(`${BASE_URL}/api/auth/get-session`);
  const session = SessionSchema.parse(await sessionResponse.json());

  const dashboardPath = await screenshot(
    context,
    "/dashboard",
    "Drive the app with agent-browser",
    path.join(outDir, "dashboard.png"),
  );
  await screenshot(context, "/", "Join Waitlist", path.join(outDir, "home.png"));

  const slug = dashboardPath.split("/").at(-1) ?? "";
  const todosResponse = await context.request.post(`${BASE_URL}/api/orpc/todo/list`, {
    data: { json: { slug } },
  });
  const { json } = TodosSchema.parse(await todosResponse.json());

  return { todos: json.todos, userName: session.user.name };
};

const renderScene = async (data: {
  todos: { title: string; completed: boolean }[];
  userName: string;
}) => {
  // @repo/ui compiles its JSX with the classic runtime, which reads a global React.
  Object.assign(globalThis, { React });
  const { COMMAND, Scene } = await import("./scene");
  const { siteConfig } = await import("../../src/lib/site-config");

  const markup = renderToStaticMarkup(
    <Scene
      data={{
        appUrl: "http://localhost:3000",
        dashboard: "dashboard.png",
        description: siteConfig.description,
        home: "home.png",
        name: siteConfig.name,
        todos: data.todos,
        userName: data.userName,
      }}
    />,
  );

  const css = await postcss([tailwind({ base: scriptDir })]).process(
    `@import "@repo/ui/globals.css";\n@source "./scene.tsx";\n`,
    { from: path.join(scriptDir, "scene.css") },
  );

  const html = `<!doctype html><html lang="en" class="dark"><head><meta charset="utf-8"><style>${css.css}</style><style>html,body{margin:0;background:var(--background)}</style></head><body>${markup}</body></html>`;
  return { command: COMMAND, html };
};

const main = async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), "og-video-"));
  const framesDir = path.join(workDir, "frames");
  await mkdir(framesDir);
  await mkdir(path.join(publicDir, "og"), { recursive: true });

  const browser = await chromium.launch();
  try {
    const appContext = await browser.newContext({
      colorScheme: "dark",
      viewport: { height: 800, width: 1280 },
    });
    const appData = await captureApp(appContext, workDir);
    await appContext.close();

    const { command, html } = await renderScene(appData);
    const scenePath = path.join(workDir, "scene.html");
    await writeFile(scenePath, html);

    const page = await browser.newPage({ viewport: { height: 630, width: 1200 } });
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
    await page.screenshot({ path: path.join(publicDir, "og.jpg"), quality: 90, type: "jpeg" });
  } finally {
    await browser.close();
  }

  const output = path.join(publicDir, "og", "og.mp4");
  execFileSync(
    "ffmpeg",
    [
      ["-y", "-loglevel", "error", "-framerate", String(FPS)],
      ["-i", path.join(framesDir, "%04d.png")],
      ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-crf", "28"],
      ["-movflags", "+faststart", "-an", output],
    ].flat(),
    { stdio: "inherit" },
  );
  await rm(workDir, { force: true, recursive: true });
  console.log(`Wrote ${path.relative(process.cwd(), output)} and public/og.jpg`);
};

await main();
