import { loadFont } from "@remotion/google-fonts/Inter";
// Inter Display if installed locally, otherwise Inter from Google Fonts.
const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800", "900"], subsets: ["latin"] });
export const C = {
  bg: "#07090F",
  bg2: "#111827",
  ink: "#FFFFFF",
  dim: "rgba(255,255,255,0.62)",
  accent: "#FF6A1A",     // pulled from the Peak's orange interior stitching
  accent2: "#FFB347",
  line: "rgba(255,255,255,0.14)",
};
export const FONT = `'Inter Display', ${fontFamily}, sans-serif`;
export const FPS = 30;
export const BEAT = 15; // 120 BPM
// Scene boundaries (frames). Every one lands on a beat.
export const T = {
  hook: 0, reveal: 45, features: 180, savings: 360, qualify: 600, cta: 720, end: 840, out: 900,
};
