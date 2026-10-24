/** Seconds; the clip loops, so the last frame (empty) leads straight into the first. */
export const DURATION = 7;
export const FPS = 30;
/** The held logo and tagline: the poster, which is also /og.jpg. */
export const POSTER_TIME = 4;

/**
 * Puts the scene in its state at time `t`. Beats: the mark launches along its own axis
 * on a soft trail and settles (0.3–1.8s), the tagline rises in (1.6–2.5s), both
 * hold (to 4.9s), the mark lifts off and everything fades (4.9–5.8s), and the
 * frame stays empty until the loop. It runs in the page through `page.evaluate`,
 * which sends its source text, so it reads nothing from this module: every helper
 * is defined inside it.
 */
/* oxlint-disable unicorn/consistent-function-scoping -- page.evaluate sends only this function's source, so its helpers must live inside it */
export const applyFrame = (t: number) => {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const progress = (from: number, to: number) => clamp((t - from) / (to - from));
  // An underdamped spring (a little overshoot) and a critically damped one (none).
  const spring = (x: number) => (x >= 1 ? 1 : 1 - Math.exp(-6 * x) * Math.cos(8 * x));
  const settle = (x: number) => (x >= 1 ? 1 : 1 - (1 + 9 * x) * Math.exp(-9 * x));
  const easeIn = (x: number) => x * x * x;
  const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`);

  const launch = progress(0.3, 1.8);
  const climb = spring(launch);
  const liftOff = easeIn(progress(4.9, 5.7));
  const fadeOut = settle(progress(4.9, 5.8));

  // The mark points up and to the right, 42.5° above horizontal (its tail at
  // (0.234, 0.756) of the box, its nose at (0.77, 0.264)), so it flies along that.
  const axisX = 0.737;
  const axisY = -0.676;
  const travel = -200 * (1 - climb) + 140 * liftOff;
  const offset = `translate(${axisX * travel}px, ${axisY * travel}px)`;

  const mark = part("mark");
  if (mark) {
    mark.style.opacity = String(clamp(progress(0.3, 0.7) - fadeOut));
    mark.style.transform = offset;
  }

  const trail = part("trail");
  if (trail) {
    // Strongest while the mark is moving fast; it trails the tail and burns out.
    const thrust = clamp(
      1.4 * Math.sin(Math.PI * progress(0.3, 1.6)) + Math.sin(Math.PI * progress(4.9, 5.8)),
    );
    trail.style.opacity = String(thrust * 0.9);
    trail.style.transform = `${offset} rotate(47.5deg) scaleY(${0.25 + 0.75 * thrust})`;
  }

  const tagline = part("tagline");
  if (tagline) {
    const rise = settle(progress(1.6, 2.5));
    tagline.style.opacity = String(clamp(rise - fadeOut));
    tagline.style.transform = `translateY(${24 * (1 - rise)}px)`;
  }
};
/* oxlint-enable unicorn/consistent-function-scoping */
