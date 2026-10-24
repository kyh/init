/**
 * The og:video scene: the Init mark launches into place on a soft trail, then the
 * tagline rises in beneath it. Drawn with @repo/ui's tokens and its Logo, sized to
 * read in a 600px link preview. Static markup only (og-video.tsx renders it);
 * timeline.ts moves it. Never shipped: nothing under src/ imports this folder.
 */
import { Logo } from "@repo/ui/components/logo";

export interface SceneCopy {
  name: string;
  description: string;
}

export const Scene = ({ copy }: { copy: SceneCopy }) => (
  <div className="bg-background relative flex h-[630px] w-[1200px] flex-col items-center justify-center overflow-hidden font-sans">
    <div className="relative size-[280px]">
      {/* The exhaust: a soft streak out of the mark's tail, along its axis (timeline.ts). */}
      <div
        data-part="trail"
        className="from-foreground/40 absolute top-[212px] left-[54px] h-[300px] w-[22px] origin-top rounded-full bg-gradient-to-b to-transparent opacity-0 blur-[5px]"
      />
      <div data-part="mark" className="absolute inset-0 opacity-0">
        <Logo aria-label={copy.name} className="text-foreground size-[280px]" />
      </div>
    </div>
    <p
      data-part="tagline"
      className="text-muted-foreground -mt-6 max-w-[860px] text-center text-[38px] leading-snug font-light text-pretty opacity-0"
    >
      {copy.description}
    </p>
  </div>
);
