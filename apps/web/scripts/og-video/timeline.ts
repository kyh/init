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
  // An underdamped spring with a small overshoot, and a critically damped one with none.
  const spring = (x: number) => (x >= 1 ? 1 : 1 - Math.exp(-7 * x) * Math.cos(7 * x));
  const settle = (x: number) => (x >= 1 ? 1 : 1 - (1 + 9 * x) * Math.exp(-9 * x));
  const easeInOut = (x: number) => x * x * (3 - 2 * x);

  // The mark points up and to the right, 42.5° above horizontal (its tail at
  // (0.234, 0.756) of the box, its nose at (0.77, 0.264)): `along` is that axis,
  // `across` the one at right angles to it (down and to the right).
  const along = { x: 0.737, y: -0.676 };
  const across = { x: 0.676, y: 0.737 };
  // Just past the frame's edge each way, so the rocket is gone for no frame at all.
  const farIn = 540;
  const farOut = 680;

  /** Where the rocket is at `time`: its distance along the axis and off it, and its hover. */
  const placeAt = (time: number) => {
    // Past the lift-off the next pass has begun: the mark is already coming back in.
    const local = time >= 6.2 ? time - loop : time;
    // In: from far down the axis on a spring, bending in off a curve.
    const climb = spring(progress(local, -0.34, 1.7));
    // Out: a small dip back down the axis, then an accelerating climb off a curve.
    const dip = easeInOut(progress(local, 5, 5.4)) * (1 - progress(local, 5.4, 5.7));
    const lift = progress(local, 5.4, 6.2) ** 2.4;
    const distance = -farIn * (1 - climb) - 16 * dip + farOut * lift;
    const offAxis = 120 * (1 - climb) ** 2 - 60 * lift ** 2;
    // The hover: eased in as it settles, eased out before the dip.
    const hovering =
      easeInOut(progress(local, 1.2, 2.2)) * (1 - easeInOut(progress(local, 4.4, 5)));
    const bob = 6 * Math.sin((2 * Math.PI * (local - 1.2)) / 2.6) * hovering;
    // The exhaust left behind at the top right fades as the next pass begins at the bottom left.
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
  // Tilt into the path: the angle between its heading and the axis, kept small. At
  // rest the hover rocks it a little instead.
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
    // Long and bright while it is fast; at rest an ember that flickers at the tail.
    const thrust = clamp(speed / 1600);
    const ember = now.hovering * (0.22 + 0.06 * Math.sin(2 * Math.PI * 1.7 * t));
    trail.style.opacity = String(Math.max(thrust * 0.9, ember) * now.visible);
    trail.style.transform = `rotate(47.5deg) scaleY(${0.18 + 0.05 * Math.sin(2 * Math.PI * 1.7 * t) * now.hovering + 1.1 * thrust})`;
  }

  const words = document.querySelectorAll<HTMLElement>('[data-part="word"]');
  for (const [index, word] of words.entries()) {
    // In: each word rises up and to the right after the rocket while it settles.
    const rise = settle(progress(t, 0.75 + 0.055 * index, 1.45 + 0.055 * index));
    // Out: each word follows the lift-off up, a beat after the one before.
    const leave = progress(t, 5.3 + 0.03 * index, 5.8 + 0.03 * index) ** 2;
    word.style.opacity = String(clamp(rise - leave));
    word.style.filter = `blur(${4 * (1 - rise) + 3 * leave}px)`;
    word.style.transform = `translate(${-10 * (1 - rise)}px, ${20 * (1 - rise) - 14 * leave}px)`;
  }
};
/* oxlint-enable unicorn/consistent-function-scoping */
