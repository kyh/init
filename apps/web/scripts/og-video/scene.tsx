/**
 * The og:video scene: one command typed, then the four apps it ships assemble.
 * Static markup only (rendered by og-video.tsx with react-dom/server); `applyFrame`
 * in timeline.ts moves it. Web and desktop are screenshots of the running app;
 * the extension popup and the mobile screen are their real markup, transcribed
 * from apps/extension/src/entrypoints/popup/app.tsx and apps/mobile/src/app/index.tsx
 * with the same @repo/ui components, classes and seeded data. Never shipped:
 * nothing under src/ imports this folder.
 */
import { Button } from "@repo/ui/components/button";
import { Logo } from "@repo/ui/components/logo";
import { ExternalLink, Puzzle, Settings } from "lucide-react";

export const COMMAND = "gh repo create my-app --template kyh/init --clone";

export interface Todo {
  title: string;
  completed: boolean;
}

export interface SceneData {
  /** Screenshot of the dashboard, as a file name beside the scene. */
  dashboard: string;
  /** Screenshot of `/`, the page the desktop window opens. */
  home: string;
  appUrl: string;
  userName: string;
  todos: Todo[];
  name: string;
  description: string;
}

const Label = ({ name, tech }: { name: string; tech: string }) => (
  <div className="bg-background/90 border-border absolute -top-3.5 left-3 z-10 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
    <span className="text-foreground">{name}</span>
    <span className="text-muted-foreground">{tech}</span>
  </div>
);

const Dots = () => (
  <div className="flex gap-1.5">
    <span className="size-2.5 rounded-full bg-[#ff5f57]" />
    <span className="size-2.5 rounded-full bg-[#febc2e]" />
    <span className="size-2.5 rounded-full bg-[#28c840]" />
  </div>
);

const Terminal = () => (
  <div
    data-part="terminal"
    className="bg-card border-border absolute top-[283px] left-[220px] flex h-16 w-[760px] items-center gap-5 rounded-xl border px-5 shadow-2xl"
  >
    <Dots />
    <div className="font-mono text-[19px] whitespace-pre">
      <span className="text-muted-foreground">$ </span>
      <span data-part="typed" className="text-foreground" />
      <span
        data-part="caret"
        className="bg-foreground inline-block h-[22px] w-[10px] align-middle"
      />
    </div>
  </div>
);

const Intro = ({ data }: { data: SceneData }) => (
  <div data-part="intro" className="absolute top-[150px] left-0 flex w-full flex-col items-center">
    <div className="flex items-center gap-3">
      <Logo className="text-foreground size-10" />
      <span className="text-foreground text-3xl font-light">{data.name}</span>
    </div>
    <p className="text-muted-foreground mt-4 text-lg font-light">{data.description}</p>
  </div>
);

const WebFrame = ({ data }: { data: SceneData }) => (
  <div
    data-part="frame"
    className="bg-card border-border absolute top-[250px] left-[36px] w-[420px] rounded-xl border shadow-2xl"
  >
    <Label name="Web" tech="Next.js" />
    <div className="border-border flex h-9 items-center gap-3 border-b px-3">
      <Dots />
      <div className="bg-muted text-muted-foreground flex-1 truncate rounded-md px-2 py-0.5 text-[11px]">
        {data.appUrl.replace(/^https?:\/\//u, "")}/dashboard
      </div>
    </div>
    {/* oxlint-disable-next-line next/no-img-element -- static markup for a file:// page, not a Next route */}
    <img src={data.dashboard} alt="" className="block w-full rounded-b-xl" />
  </div>
);

const DesktopFrame = ({ data }: { data: SceneData }) => (
  <div
    data-part="frame"
    className="bg-card border-border absolute top-[118px] left-[300px] w-[600px] rounded-xl border shadow-2xl"
  >
    <Label name="Desktop" tech="Tauri" />
    <div className="border-border relative flex h-8 items-center border-b px-3">
      <Dots />
      <span className="text-muted-foreground absolute inset-x-0 text-center text-xs">
        {data.name}
      </span>
    </div>
    {/* oxlint-disable-next-line next/no-img-element -- static markup for a file:// page, not a Next route */}
    <img src={data.home} alt="" className="block w-full rounded-b-xl" />
  </div>
);

/** apps/mobile/src/app/index.tsx, signed in, at iPhone size (390×844) shown at half scale. */
const MobileFrame = ({ data }: { data: SceneData }) => (
  <div
    data-part="frame"
    className="absolute top-[112px] left-[952px] h-[438px] w-[211px] rounded-[40px] border border-white/15 bg-black p-2 shadow-2xl"
  >
    <Label name="Mobile" tech="Expo" />
    <div className="relative h-full w-full overflow-hidden rounded-[32px]">
      <div className="bg-background absolute top-0 left-0 h-[844px] w-[390px] origin-top-left scale-50">
        <div className="text-foreground flex h-[54px] items-end justify-between px-8 pb-2 text-[17px] font-semibold">
          <span>9:41</span>
          <span className="bg-foreground h-3 w-7 rounded-sm" />
        </div>
        <div className="border-border text-foreground border-b py-3 text-center text-[17px] font-semibold">
          Home Page
        </div>
        <div className="h-full w-full p-4">
          <p className="text-foreground pb-2 text-center text-5xl font-bold">
            <span className="text-primary">{data.name}</span>
          </p>
          <p className="text-foreground pb-2 text-center text-xl font-semibold">
            Hello, {data.userName}
          </p>
          <div className="bg-primary flex items-center rounded-sm p-2">
            <span>Sign Out</span>
          </div>
          <div className="pt-4">
            {data.todos.map((todo) => (
              <p key={todo.title} className="text-foreground py-1">
                {todo.completed ? "☑" : "☐"} {todo.title}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** apps/extension/src/entrypoints/popup/app.tsx, loaded, under a toolbar strip. */
const ExtensionFrame = ({ data }: { data: SceneData }) => (
  <div
    data-part="frame"
    className="bg-card border-border absolute top-[326px] left-[592px] w-[338px] rounded-xl border p-2 shadow-2xl"
  >
    <Label name="Extension" tech="WXT" />
    <div className="text-muted-foreground flex h-7 items-center justify-end gap-2 px-1">
      <span className="bg-muted text-foreground flex size-6 items-center justify-center rounded-md">
        <Logo className="size-4" />
      </span>
      <Puzzle className="size-4" />
    </div>
    <div className="bg-background border-border flex h-[228px] w-[320px] flex-col justify-between rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <Logo className="size-7" />
        <Button variant="ghost" size="icon-sm" title="Settings">
          <Settings />
        </Button>
      </div>
      <div className="space-y-1">
        <h1 className="font-semibold">{data.name}</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Your AI-native starter kit for building, launching, and scaling applications.
        </p>
      </div>
      <div className="space-y-2">
        <Button className="w-full">
          <ExternalLink />
          Open {data.name}
        </Button>
        <p className="text-muted-foreground truncate text-center text-xs">{data.appUrl}</p>
      </div>
    </div>
  </div>
);

/** Back to front: desktop sits behind web, extension and mobile. */
export const Scene = ({ data }: { data: SceneData }) => (
  <div className="bg-background relative h-[630px] w-[1200px] overflow-hidden font-sans">
    <Intro data={data} />
    <div data-part="frames" className="absolute inset-0">
      <DesktopFrame data={data} />
      <WebFrame data={data} />
      <ExtensionFrame data={data} />
      <MobileFrame data={data} />
    </div>
    <Terminal />
  </div>
);
