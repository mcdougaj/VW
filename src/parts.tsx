import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import QRCode from "qrcode";
import { C, FONT } from "./theme";
import { clamp } from "./motion";

// Photo layer with slow push + drift. Without a real photo it renders a clearly
// labelled placeholder so nobody mistakes the pilot for a finished ad.
// band: listing photos are 4:3 (640x480), so "cover" in 9:16 crops away the ends of the car.
// band = blurred cover backdrop + the sharp photo at full width, centred on y=bandY.
export const PhotoSlot: React.FC<{
  src?: string; label: string; from: number; dur: number;
  zoom?: [number, number]; drift?: [number, number]; blur?: number; band?: boolean; bandY?: number;
}> = ({ src, label, from, dur, zoom = [1.08, 1.2], drift = [-30, 30], blur = 0, band = false, bandY = 600 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [from, from + dur], [0, 1], clamp);
  const s = zoom[0] + (zoom[1] - zoom[0]) * p;
  const x = drift[0] + (drift[1] - drift[0]) * p;
  const style: React.CSSProperties = {
    width: "100%", height: "100%", objectFit: "cover",
    transform: `translateX(${x}px) scale(${s})`, filter: blur ? `blur(${blur}px)` : undefined,
  };
  if (src && band) {
    const h = 1080 * 0.75;
    return (
      <AbsoluteFill>
        <Img src={staticFile(src)} style={{ ...style, transform: "scale(1.15)", filter: "blur(40px) brightness(0.45) saturate(1.2)" }} />
        <Img src={staticFile(src)} style={{
          position: "absolute", left: 0, top: bandY - h / 2, width: 1080, height: h,
          transform: `translateX(${x}px) scale(${s})`, transformOrigin: "50% 50%",
          maskImage: "linear-gradient(180deg, transparent 0%, #000 9%, #000 91%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 9%, #000 91%, transparent 100%)",
        }} />
      </AbsoluteFill>
    );
  }
  if (src) return <AbsoluteFill><Img src={staticFile(src)} style={style} /></AbsoluteFill>;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 45%, #2a3245 0%, ${C.bg2} 45%, ${C.bg} 100%)` }}>
      <AbsoluteFill style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SuvSilhouette />
      </AbsoluteFill>
      <div style={{
        position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: FONT,
        fontSize: 26, letterSpacing: 6, color: "rgba(255,255,255,0.45)", fontWeight: 600,
      }}>PHOTO SLOT · {label.toUpperCase()}</div>
    </AbsoluteFill>
  );
};

const SuvSilhouette = () => (
  <svg width="900" height="420" viewBox="0 0 900 420">
    <defs>
      <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3b4458" /><stop offset="1" stopColor="#151a26" />
      </linearGradient>
    </defs>
    <ellipse cx="450" cy="372" rx="400" ry="22" fill="rgba(0,0,0,0.55)" />
    <path d="M70 300 L80 230 Q90 200 140 190 L250 180 L320 110 Q335 95 360 95 L660 95 Q690 95 705 115
             L770 185 L820 195 Q850 202 852 235 L855 300 Q855 320 835 320 L70 320 Q60 320 70 300 Z" fill="url(#body)" />
    <path d="M335 120 L655 120 Q675 120 688 135 L735 185 L280 185 Z" fill="#0b0f18" opacity="0.9" />
    <rect x="490" y="120" width="10" height="66" fill="#3b4458" />
    <circle cx="220" cy="322" r="58" fill="#0b0e14" /><circle cx="220" cy="322" r="30" fill="#2a3040" />
    <circle cx="690" cy="322" r="58" fill="#0b0e14" /><circle cx="690" cy="322" r="30" fill="#2a3040" />
    <rect x="800" y="225" width="44" height="14" rx="6" fill={C.accent} opacity="0.8" />
  </svg>
);

// Diagonal light streak across the frame (screen blend) — the "paint shine".
export const LightSweep: React.FC<{ at: number; dur?: number }> = ({ at, dur = 26 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [-0.6, 1.6], clamp);
  if (p <= -0.6 || p >= 1.6) return null;
  return (
    <AbsoluteFill style={{
      mixBlendMode: "screen", pointerEvents: "none",
      background: `linear-gradient(115deg, transparent ${p * 100 - 14}%, rgba(255,255,255,0.0) ${p * 100 - 8}%,
        rgba(255,255,255,0.55) ${p * 100}%, rgba(255,255,255,0.0) ${p * 100 + 6}%, transparent ${p * 100 + 12}%)`,
    }} />
  );
};

export const Vignette = () => (
  <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 45%, rgba(0,0,0,0.75) 100%)" }} />
);

// Film grain keyed to frame number (deterministic).
export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" seed={f % 12} /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

export const QR: React.FC<{ text: string; size: number }> = ({ text, size }) => {
  const q = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = q.modules.size; const cell = size / (n + 8);
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
    if (q.modules.get(x, y)) rects.push(<rect key={`${x}-${y}`} x={(x + 4) * cell} y={(y + 4) * cell} width={cell + 0.3} height={cell + 0.3} />);
  return (
    <svg width={size} height={size} style={{ background: "#fff", borderRadius: 18 }}>
      <g fill="#000">{rects}</g>
    </svg>
  );
};
