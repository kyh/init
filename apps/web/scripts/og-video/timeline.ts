/** Seconds; the clip loops, so the last frame leads straight back into the first. */
export const DURATION = 10;
export const FPS = 30;
/** A moment with every frame assembled: the poster, which is also /og.jpg. */
export const POSTER_TIME = 5.6;

interface FrameInput {
  t: number;
  command: string;
}

/**
 * Puts the scene in its state at time `t`. Beats: the command types (0.4–2.0s),
 * the terminal rises and the four apps spring in (2.6–4.3s) and hold, they leave
 * (6.5s), the wordmark holds (7.1–8.9s), and the empty prompt returns for the loop.
 * It runs in the page through `page.evaluate`, which sends its source text, so it
 * reads nothing from this module: every helper is defined inside it.
 */
/* oxlint-disable unicorn/consistent-function-scoping -- page.evaluate sends only this function's source, so its helpers must live inside it */
export const applyFrame = ({ t, command }: FrameInput) => {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const progress = (from: number, to: number) => clamp((t - from) / (to - from));
  // An underdamped spring (a little overshoot) and a critically damped one (none).
  const spring = (x: number) => (x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(9 * x));
  const settle = (x: number) => (x >= 1 ? 1 : 1 - (1 + 9 * x) * Math.exp(-9 * x));
  const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`);

  const typed = part("typed");
  if (typed) {
    const count = t >= 9 ? 0 : Math.round(progress(0.4, 2) * command.length);
    typed.textContent = command.slice(0, count);
  }

  const caret = part("caret");
  if (caret) {
    const typing = t > 0.4 && t < 2;
    caret.style.opacity = typing || Math.floor(t * 2) % 2 === 0 ? "1" : "0";
  }

  const terminal = part("terminal");
  if (terminal) {
    if (t < 9) {
      const rise = settle(progress(2.6, 3.4));
      terminal.style.transform = `translateY(${-247 * rise}px) scale(${1 - 0.3 * rise})`;
      terminal.style.opacity = String(1 - progress(6.4, 6.8));
    } else {
      const back = settle(progress(9.2, 9.9));
      terminal.style.transform = `translateY(${12 * (1 - back)}px) scale(${0.97 + 0.03 * back})`;
      terminal.style.opacity = String(back);
    }
  }

  const items = document.querySelectorAll<HTMLElement>('[data-part="frame"]');
  for (const [index, item] of items.entries()) {
    const start = 3 + index * 0.18;
    const enter = spring(progress(start, start + 1.1));
    const exit = settle(progress(6.4 + index * 0.05, 7));
    item.style.opacity = String(clamp(progress(start, start + 0.3) - exit));
    item.style.transform = `translateY(${60 * (1 - enter) - 24 * exit}px) scale(${0.92 + 0.08 * enter - 0.03 * exit})`;
  }

  const wordmark = part("wordmark");
  if (wordmark) {
    const enter = settle(progress(6.9, 7.6));
    const exit = settle(progress(8.9, 9.3));
    wordmark.style.opacity = String(clamp(enter - exit));
    wordmark.style.transform = `scale(${0.96 + 0.04 * enter})`;
  }
};
/* oxlint-enable unicorn/consistent-function-scoping */
