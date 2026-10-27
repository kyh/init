/**
 * The og:video scene: the Init mark arcs into place on a soft trail, the tagline
 * rises in word by word beneath it, the mark hovers, then lifts off and comes
 * round again. Drawn with @repo/ui's tokens and its Logo, sized to read in a
 * 600px link preview. Static markup only (og-video.tsx renders it);
 * timeline.ts moves it. Never shipped: nothing under src/ imports this folder.
 */
import { Logo } from "@repo/ui/components/logo";

export interface SceneCopy {
  name: string;
  description: string;
}

export const Scene = ({ copy }: { copy: SceneCopy }) => {
  const words = copy.description.split(" ");
  return (
    <div className="bg-background relative flex h-[630px] w-[1200px] flex-col items-center justify-center overflow-hidden font-sans">
      <div className="relative size-[280px]">
        {/* The rocket: the mark and its exhaust move together; timeline.ts flies and tilts it. */}
        <div data-part="rocket" className="absolute inset-0">
          {/* The exhaust: a soft streak out of the mark's tail, along its axis, as long as it is fast. */}
          <div
            data-part="trail"
            className="from-foreground/40 absolute top-[212px] left-[54px] h-[300px] w-[22px] origin-top rounded-full bg-gradient-to-b to-transparent opacity-0 blur-[5px]"
          />
          <Logo aria-label={copy.name} className="text-foreground absolute inset-0 size-[280px]" />
        </div>
      </div>
      <p className="text-muted-foreground -mt-6 max-w-[860px] text-center text-[38px] leading-snug font-light text-pretty">
        {words.map((word, index) => (
          // The words rise in one after another behind the rocket (timeline.ts).
          <span
            key={`${word}-${String(index)}`}
            data-part="word"
            className="inline-block opacity-0"
          >
            {word}
            {index < words.length - 1 ? "\u00A0" : ""}
          </span>
        ))}
      </p>
    </div>
  );
};
