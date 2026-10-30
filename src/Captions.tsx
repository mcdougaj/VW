import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT } from "./theme";
import { soft } from "./motion";

export type CaptionLine = { from: number; to: number; text: string; show: string };

// Word-by-word karaoke captions in a fixed band above the TikTok/Reels bottom UI.
// Word timing is spread evenly across each line until a real VO is aligned.
export const Captions: React.FC<{ lines: CaptionLine[] }> = ({ lines }) => {
  const f = useCurrentFrame();
  const line = lines.find((l) => f >= l.from && f < l.to);
  if (!line) return null;
  const words = line.show.split(" ");
  const per = (line.to - line.from) / words.length;
  const pop = soft(f, line.from, 6);
  return (
    <div style={{
      position: "absolute", left: 70, right: 70, top: 1400, display: "flex", flexWrap: "wrap",
      justifyContent: "center", gap: "0 18px", transform: `translateY(${(1 - pop) * 20}px)`, opacity: pop,
    }}>
      {words.map((w, i) => {
        const on = f >= line.from + i * per;
        const hot = on && f < line.from + (i + 1) * per;
        return (
          <span key={i} style={{
            fontFamily: FONT, fontSize: 60, fontWeight: 900, lineHeight: 1.18, letterSpacing: -0.5,
            color: hot ? C.accent : C.ink, opacity: on ? 1 : 0.35,
            textShadow: "0 4px 18px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,1)",
          }}>{w}</span>
        );
      })}
    </div>
  );
};
