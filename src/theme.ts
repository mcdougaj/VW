// Inter bundled from npm (@fontsource) so renders work offline on any machine.
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";

export const C = {
  bg: "#07090F",
  bg2: "#111827",
  ink: "#FFFFFF",
  dim: "rgba(255,255,255,0.62)",
  accent: "#FF6A1A",     // pulled from the Peak's orange interior stitching
  accent2: "#FFB347",
  line: "rgba(255,255,255,0.14)",
};
export const FONT = "'Inter Display', 'Inter', sans-serif";
export const FPS = 30;
export const BEAT = 15; // 120 BPM
// Scene boundaries (frames). Every one lands on a beat.
export const T = {
  hook: 0, reveal: 45, features: 180, savings: 360, qualify: 600, cta: 720, end: 840, out: 900,
};
