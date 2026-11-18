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
        {}
        <div data-part="rocket" className="absolute inset-0">
          {}
          <div
            data-part="trail"
            className="from-foreground/40 absolute top-[212px] left-[54px] h-[300px] w-[22px] origin-top rounded-full bg-gradient-to-b to-transparent opacity-0 blur-[5px]"
          />
          <Logo aria-label={copy.name} className="text-foreground absolute inset-0 size-[280px]" />
        </div>
      </div>
      <p className="text-muted-foreground -mt-6 max-w-[860px] text-center text-[38px] leading-snug font-light text-pretty">
        {words.map((word, index) => (
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
