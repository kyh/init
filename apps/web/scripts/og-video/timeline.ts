/** Seconds; the clip loops, so the last frame leads straight back into the first. */
export const DURATION = 9;
export const FPS = 30;
/** A moment with every frame assembled: the poster, which is also /og.jpg. */
export const POSTER_TIME = 6.6;

interface FrameInput {
  t: number;
  command: string;
}

/**
 * Puts the scene in its state at time `t`. It runs in the page through
 * `page.evaluate`, which sends its source text, so it reads nothing from this
 * module: every helper is defined inside it.
 */
/* oxlint-disable unicorn/consistent-function-scoping -- page.evaluate sends only this function's source, so its helpers must live inside it */
export const applyFrame = ({ t, command }: FrameInput) => {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const progress = (from: number, to: number) => clamp((t - from) / (to - from));
  const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  const easeOutBack = (x: number) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
  const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`);

  // Out at 7.6s, then the empty prompt and intro come back for the loop.
  const exit = progress(7.6, 8.3);
  const reset = t >= 8.3;

  const typed = part("typed");
  if (typed) {
    const count = reset ? 0 : Math.round(progress(0.5, 2.1) * command.length);
    typed.textContent = command.slice(0, count);
  }

  const caret = part("caret");
  if (caret) {
    const typing = t > 0.5 && t < 2.1;
    caret.style.opacity = typing || Math.floor(t * 2) % 2 === 0 ? "1" : "0";
  }

  const terminal = part("terminal");
  if (terminal) {
    const rise = reset ? 0 : easeInOut(progress(2.3, 3.1));
    const opacity = reset ? progress(8.3, 8.9) : 1 - exit;
    terminal.style.transform = `translateY(${-262 * rise}px) scale(${1 - 0.22 * rise})`;
    terminal.style.opacity = String(opacity);
  }

  const intro = part("intro");
  if (intro) {
    const opacity = reset ? progress(8.3, 8.9) : 1 - progress(2.2, 2.7);
    intro.style.opacity = String(opacity);
    intro.style.transform = `translateY(${reset ? 0 : -16 * progress(2.2, 2.7)}px)`;
  }

  const frames = part("frames");
  if (frames) {
    // A slow push-in while the frames hold.
    frames.style.transform = `scale(${1 + 0.02 * progress(3, 7.6)})`;
  }

  const items = document.querySelectorAll<HTMLElement>('[data-part="frame"]');
  for (const [index, item] of items.entries()) {
    const enter = progress(2.9 + index * 0.24, 3.55 + index * 0.24);
    const lift = easeOutBack(enter);
    item.style.opacity = String(Math.min(enter * 1.6, 1) * (1 - exit));
    item.style.transform = `translateY(${48 * (1 - lift) - 12 * exit}px) scale(${0.9 + 0.1 * lift})`;
  }
};
/* oxlint-enable unicorn/consistent-function-scoping */
