/**
 * The og:video scene: one command typed, the four apps it ships assemble, then the
 * wordmark. A simplified picture of the product, not a capture of it: every frame
 * is drawn here with @repo/ui's tokens, components and the apps' own copy (the
 * dashboard's todos are the seed's, the desktop window shows the marketing page,
 * the popup and phone follow apps/extension/src/entrypoints/popup/app.tsx and
 * apps/mobile/src/app/index.tsx), sized to read in a 600px link preview.
 * Static markup only (og-video.tsx renders it); timeline.ts moves it. Never
 * shipped: nothing under src/ imports this folder.
 */
import { Button } from "@repo/ui/components/button";
import { Logo } from "@repo/ui/components/logo";
import { CheckSquare, CreditCard, ExternalLink, Settings, Users2 } from "lucide-react";

export const COMMAND = "gh repo create my-app --template kyh/init --clone";

// The seeded sample todos (packages/service/src/seed.ts): product copy, not user data.
const TODOS = [
  { completed: true, title: "Read AGENTS.md" },
  { completed: false, title: "Run pnpm verify" },
  { completed: false, title: "Drive the app with agent-browser" },
];

export interface SceneCopy {
  name: string;
  description: string;
}

const Label = ({ name, tech }: { name: string; tech: string }) => (
  <div className="bg-background border-border absolute -top-5 left-5 z-10 flex items-center gap-2 rounded-full border px-4 py-1 text-lg">
    <span className="text-foreground font-medium">{name}</span>
    <span className="text-muted-foreground">{tech}</span>
  </div>
);

const Dots = () => (
  <div className="flex gap-2">
    <span className="size-3.5 rounded-full bg-[#ff5f57]" />
    <span className="size-3.5 rounded-full bg-[#febc2e]" />
    <span className="size-3.5 rounded-full bg-[#28c840]" />
  </div>
);

const Terminal = () => (
  <div
    data-part="terminal"
    className="bg-card border-border absolute top-[277px] left-[110px] flex h-[76px] w-[980px] items-center gap-6 rounded-2xl border px-7 shadow-2xl"
  >
    <Dots />
    <div className="font-mono text-[28px] whitespace-pre">
      <span className="text-muted-foreground">$ </span>
      <span data-part="typed" className="text-foreground" />
      <span
        data-part="caret"
        className="bg-foreground inline-block h-[32px] w-[14px] align-middle"
      />
    </div>
  </div>
);

const Wordmark = ({ copy }: { copy: SceneCopy }) => (
  <div
    data-part="wordmark"
    className="absolute inset-0 flex flex-col items-center justify-center opacity-0"
  >
    <div className="flex items-center gap-5">
      <Logo className="text-foreground size-24" />
      <span className="text-foreground text-[84px] font-light tracking-tight">{copy.name}</span>
    </div>
    <p className="text-muted-foreground mt-6 max-w-[760px] text-center text-[30px] leading-snug font-light">
      {copy.description}
    </p>
  </div>
);

const WebFrame = () => (
  <div
    data-part="frame"
    className="bg-card border-border absolute top-[150px] left-[28px] h-[440px] w-[400px] rounded-2xl border shadow-2xl"
  >
    <Label name="Web" tech="Next.js" />
    <div className="border-border flex h-12 items-center gap-4 border-b px-4">
      <Dots />
      <div className="bg-muted text-muted-foreground flex-1 rounded-md px-3 py-0.5 text-lg">
        /dashboard
      </div>
    </div>
    <div className="flex">
      <div className="text-muted-foreground flex w-16 flex-col items-center gap-5 pt-5">
        <span className="bg-muted text-foreground flex size-10 items-center justify-center rounded-lg">
          <CheckSquare className="size-5" />
        </span>
        <Users2 className="size-5" />
        <CreditCard className="size-5" />
        <Settings className="size-5" />
      </div>
      <div className="flex-1 space-y-3 py-5 pr-5">
        <p className="text-foreground text-[28px]">Todos</p>
        {TODOS.map((todo) => (
          <div
            key={todo.title}
            className="border-border flex items-start gap-3 rounded-xl border px-4 py-3"
          >
            <span
              className={`mt-1 size-5 shrink-0 rounded-[5px] border ${todo.completed ? "bg-primary border-primary" : "border-input"}`}
            />
            <div>
              <p
                className={`text-xl leading-snug ${todo.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {todo.title}
              </p>
              <p className="text-muted-foreground text-base">
                {todo.completed ? "Completed" : "Pending"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** The window opens the web app at `/`: the marketing page, simplified. */
const DesktopFrame = ({ copy }: { copy: SceneCopy }) => (
  <div
    data-part="frame"
    className="bg-card border-border absolute top-[110px] left-[452px] h-[282px] w-[470px] rounded-2xl border shadow-2xl"
  >
    <Label name="Desktop" tech="Tauri" />
    <div className="border-border relative flex h-11 items-center border-b px-4">
      <Dots />
      <span className="text-muted-foreground absolute inset-x-0 text-center text-lg">
        {copy.name}
      </span>
    </div>
    <div className="px-7 pt-5">
      <div className="flex items-center justify-between">
        <Logo className="text-foreground size-8" />
        <span className="bg-muted text-foreground rounded-full px-3 py-0.5 text-base">
          Dashboard
        </span>
      </div>
      <p className="text-muted-foreground mt-5 text-lg font-light">
        For you and your coding agents
      </p>
      <p className="text-foreground mt-2 text-[25px] leading-tight font-light">
        {copy.description}
      </p>
    </div>
  </div>
);

/** apps/extension/src/entrypoints/popup/app.tsx, loaded, scaled up. */
const ExtensionFrame = ({ copy }: { copy: SceneCopy }) => (
  <div
    data-part="frame"
    className="bg-card border-border absolute top-[414px] left-[470px] w-[430px] rounded-2xl border p-5 shadow-2xl"
  >
    <Label name="Extension" tech="WXT" />
    <div className="flex items-center gap-3 pt-1">
      <Logo className="text-foreground size-9" />
      <p className="text-foreground flex-1 text-[26px] font-semibold">{copy.name}</p>
      <Settings className="text-muted-foreground size-6" />
    </div>
    <p className="text-muted-foreground mt-2 text-lg leading-snug">
      Your AI-native starter kit for building, launching, and scaling applications.
    </p>
    <Button className="mt-4 h-12 w-full text-lg [&_svg:not([class*='size-'])]:size-5">
      <ExternalLink />
      Open {copy.name}
    </Button>
  </div>
);

/** apps/mobile/src/app/index.tsx, signed in as the seeded user. */
const MobileFrame = ({ copy }: { copy: SceneCopy }) => (
  <div
    data-part="frame"
    className="absolute top-[108px] left-[950px] h-[490px] w-[226px] rounded-[44px] border border-white/15 bg-black p-2.5 shadow-2xl"
  >
    <Label name="Mobile" tech="Expo" />
    <div className="bg-background h-full w-full overflow-hidden rounded-[36px] px-4">
      <div className="text-foreground flex h-11 items-end justify-between px-3 text-base font-semibold">
        <span>9:41</span>
        <span className="bg-foreground h-2.5 w-6 rounded-sm" />
      </div>
      <p className="text-foreground pt-6 pb-1 text-center text-[52px] font-bold">
        <span className="text-primary">{copy.name}</span>
      </p>
      <p className="text-foreground pb-3 text-center text-xl font-semibold">Hello, Dev User</p>
      <div className="bg-primary text-primary-foreground flex items-center justify-center rounded-md p-2 text-lg">
        Sign Out
      </div>
      <div className="space-y-2 pt-5">
        {TODOS.map((todo) => (
          <p key={todo.title} className="text-foreground text-lg leading-snug">
            {todo.completed ? "☑" : "☐"} {todo.title}
          </p>
        ))}
      </div>
    </div>
  </div>
);

/** Back to front: the desktop window sits behind the popup. */
export const Scene = ({ copy }: { copy: SceneCopy }) => (
  <div className="bg-background relative h-[630px] w-[1200px] overflow-hidden font-sans">
    <div data-part="frames" className="absolute inset-0">
      <DesktopFrame copy={copy} />
      <WebFrame />
      <ExtensionFrame copy={copy} />
      <MobileFrame copy={copy} />
    </div>
    <Terminal />
    <Wordmark copy={copy} />
  </div>
);
