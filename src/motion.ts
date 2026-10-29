import { interpolate, spring, Easing } from "remotion";
import { FPS } from "./theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const slam = (f: number, at: number) =>
  spring({ frame: f - at, fps: FPS, config: { damping: 11, stiffness: 220, mass: 0.7 } });
export const soft = (f: number, at: number, dur = 18) =>
  spring({ frame: f - at, fps: FPS, durationInFrames: dur, config: { damping: 200 } });
export const ease = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
// Deterministic shake keyed off frame number — decays over `len` frames.
export const shake = (f: number, at: number, amp = 18, len = 10) => {
  const k = f - at;
  if (k < 0 || k > len) return { x: 0, y: 0 };
  const d = 1 - k / len;
  return { x: Math.sin(k * 7.3) * amp * d, y: Math.cos(k * 5.1) * amp * d };
};
export const flash = (f: number, at: number, len = 5) => (f < at ? 0 : interpolate(f - at, [0, len], [0.9, 0], clamp));
