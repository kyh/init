/** Seconds; the clip loops: the mark lifting off the top right comes straight back in at the bottom left. */
export const DURATION = 6.5;
export const FPS = 30;

/** The mark hovering over the tagline: the poster, which is also /og.jpg. */
export const POSTER_TIME = 3;

/**
 * Puts the scene in its state at time `t`, one continuous gesture. The mark arcs in
 * from the bottom left along its own axis on a spring (in frame from the first frame, settled by
 * 1.7s), tilting into its path, its exhaust as long as it is fast; the tagline's words
 * rise in after it while it settles (0.75–2.2s); it hovers with a glowing ember (to
 * 5s); it dips, then lifts off to the top right as the words follow it out (5–6.2s),
 * and comes back in at the bottom left, so the loop has no cut and no empty frame. It
 * runs in the page through `page.evaluate`, which sends its source text, so it reads
 * nothing from this module: every helper is defined inside it.
 */
/* oxlint-disable unicorn/consistent-function-scoping -- page.evaluate sends only this function's source, so its helpers must live inside it */
export const applyFrame = (t: number) => {
  const loop = 6.5;
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const progress = (time: number, from: number, to: number) => clamp((time - from) / (to - from));
  const spring = (x: number) => (x >= 1 ? 1 : 1 - Math.exp(-7 * x) * Math.cos(7 * x));
  const settle = (x: number) => (x >= 1 ? 1 : 1 - (1 + 9 * x) * Math.exp(-9 * x));
  const easeInOut = (x: number) => x * x * (3 - 2 * x);

  const along = { x: 0.737, y: -0.676 };
  const across = { x: 0.676, y: 0.737 };
  const farIn = 540;
  const farOut = 680;

  const placeAt = (time: number) => {
    const local = time >= 6.2 ? time - loop : time;
    const climb = spring(progress(local, -0.34, 1.7));
    const dip = easeInOut(progress(local, 5, 5.4)) * (1 - progress(local, 5.4, 5.7));
    const lift = progress(local, 5.4, 6.2) ** 2.4;
    const distance = -farIn * (1 - climb) - 16 * dip + farOut * lift;
    const offAxis = 120 * (1 - climb) ** 2 - 60 * lift ** 2;

    const hovering =
      easeInOut(progress(local, 1.2, 2.2)) * (1 - easeInOut(progress(local, 4.4, 5)));

    const bob = 6 * Math.sin((2 * Math.PI * (local - 1.2)) / 2.6) * hovering;
    const visible = (1 - progress(local, 6.05, 6.2)) * progress(local, -0.34, -0.15);

    return {
      bob,
      hovering,
      visible,
      x: along.x * distance + across.x * offAxis,
      y: along.y * distance + across.y * offAxis + bob,
    };
  };

  const now = placeAt(t);
  const step = 1 / 120;
  const before = placeAt(t - step);
  const vx = (now.x - before.x) / step;
  const vy = (now.y - before.y) / step;
  const speed = Math.hypot(vx, vy);
  const heading = speed > 60 ? Math.atan2(vy, vx) - Math.atan2(along.y, along.x) : 0;
  const tilt = Math.max(-8, Math.min(8, (heading * 180) / Math.PI)) * clamp(speed / 400);
  const rock = -0.25 * now.bob;

  const part = (name: string) => document.querySelector<HTMLElement>(`[data-part="${name}"]`);

  const rocket = part("rocket");

  if (rocket) {
    rocket.style.transform = `translate(${now.x}px, ${now.y}px) rotate(${tilt + rock}deg)`;
  }

  const trail = part("trail");

  if (trail) {
    const thrust = clamp(speed / 1600);
    const ember = now.hovering * (0.22 + 0.06 * Math.sin(2 * Math.PI * 1.7 * t));
    trail.style.opacity = String(Math.max(thrust * 0.9, ember) * now.visible);
    trail.style.transform = `rotate(47.5deg) scaleY(${0.18 + 0.05 * Math.sin(2 * Math.PI * 1.7 * t) * now.hovering + 1.1 * thrust})`;
  }

  const words = document.querySelectorAll<HTMLElement>('[data-part="word"]');

  for (const [index, word] of words.entries()) {
    const rise = settle(progress(t, 0.75 + 0.055 * index, 1.45 + 0.055 * index));
    const leave = progress(t, 5.3 + 0.03 * index, 5.8 + 0.03 * index) ** 2;
    word.style.opacity = String(clamp(rise - leave));
    word.style.filter = `blur(${4 * (1 - rise) + 3 * leave}px)`;
    word.style.transform = `translate(${-10 * (1 - rise)}px, ${20 * (1 - rise) - 14 * leave}px)`;
  }
};
/* oxlint-enable unicorn/consistent-function-scoping */
