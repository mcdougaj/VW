import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, T, BEAT } from "./theme";
import { clamp, ease, flash, shake, slam, soft } from "./motion";
import { Grain, LightSweep, PhotoSlot, QR, Vignette } from "./parts";
import { ListingProps, total, usd } from "./data";

const txt = (size: number, weight = 900, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: FONT, fontSize: size, fontWeight: weight, color: C.ink, lineHeight: 1, letterSpacing: -1, ...extra,
});
const center: React.CSSProperties = { position: "absolute", left: 0, right: 0, textAlign: "center" };
const Flash: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#fff", opacity: flash(f, at) }} />;
};

// 0–1.5 s: the number slams in. No logo, no intro.
const Hook: React.FC<{ l: ListingProps }> = ({ l }) => {
  const f = useCurrentFrame();
  const s = slam(f, 0); const sh = shake(f, 0, 22);
  const out = ease(f, 36, 45);
  return (
    <AbsoluteFill style={{ transform: `translateX(${-out * 1080}px)`, filter: `blur(${out * 30}px)` }}>
      <PhotoSlot src={l.photos[0]} label="exterior" from={0} dur={45} blur={18} zoom={[1.3, 1.4]} />
      <AbsoluteFill style={{ background: "rgba(7,9,15,0.72)" }} />
      <div style={{ ...center, top: 600, transform: `translate(${sh.x}px,${sh.y}px)` }}>
        <div style={{ ...txt(84, 800, { letterSpacing: 18, color: C.accent }), opacity: soft(f, 2, 8) }}>SAVE</div>
        <div style={{ ...txt(300, 900, { letterSpacing: -10 }), marginTop: 18, transform: `scale(${2.4 - 1.4 * s})` }}>
          {usd(total(l))}
        </div>
        <div style={{ ...txt(54, 700, { letterSpacing: 12, color: C.dim }), marginTop: 26, opacity: soft(f, 6, 8) }}>OFF MSRP</div>
      </div>
      <div style={{ ...center, top: 1330, ...txt(46, 700, { letterSpacing: 4 }), opacity: soft(f, 12, 10) }}>
        {l.year} {l.model.toUpperCase()} {l.trim.toUpperCase()}
      </div>
      <Flash at={0} />
    </AbsoluteFill>
  );
};

// 1.5–6 s: whip into the hero shot, paint shine, kinetic title.
const Reveal: React.FC<{ l: ListingProps }> = ({ l }) => {
  const f = useCurrentFrame(); const g = f + T.reveal; // global frame
  const inn = 1 - ease(g, T.reveal, T.reveal + 9);
  const words = [`${l.year}`, l.model.toUpperCase(), l.trim.toUpperCase()];
  return (
    <AbsoluteFill style={{ transform: `translateX(${inn * 1080}px)`, filter: `blur(${inn * 30}px)` }}>
      <PhotoSlot src={l.photos[0]} label="exterior 3/4 front" from={0} dur={135} zoom={[1.18, 1.05]} drift={[40, -40]} />
      <LightSweep at={25} /><LightSweep at={95} dur={30} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 50%, rgba(7,9,15,0.92) 82%)" }} />
      <div style={{ position: "absolute", left: 80, right: 80, top: 1180 }}>
        {words.map((w, i) => {
          const p = slam(f, 15 + i * BEAT);
          return (
            <div key={i} style={{ overflow: "hidden" }}>
              <div style={{
                ...txt(i === 1 ? 210 : i === 0 ? 64 : 76, i === 1 ? 900 : 700, { letterSpacing: i === 1 ? -6 : 3 }),
                color: i === 0 ? C.accent : C.ink, transform: `translateY(${(1 - p) * 110}%)`, marginTop: i === 1 ? 6 : 10,
              }}>{w}</div>
            </div>
          );
        })}
        <div style={{ height: 10, background: C.accent, marginTop: 26, width: `${ease(f, 60, 80) * 100}%` }} />
      </div>
    </AbsoluteFill>
  );
};

// 6–12 s: feature chips snap in on the beat.
const Features: React.FC<{ l: ListingProps }> = ({ l }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <PhotoSlot src={l.photos[1] ?? l.photos[0]} label="interior / cargo" from={0} dur={180} zoom={[1.05, 1.22]} drift={[0, -20]} />
      <AbsoluteFill style={{ background: "rgba(7,9,15,0.62)" }} />
      <div style={{ ...center, top: 290, ...txt(44, 700, { letterSpacing: 14, color: C.accent }), opacity: soft(f, 0, 10) }}>
        BUILT FOR IT
      </div>
      {l.features.slice(0, 6).map((ft, i) => {
        const at = 15 + i * BEAT; const p = slam(f, at); const left = i % 2 === 0;
        return (
          <div key={ft} style={{
            position: "absolute", top: 420 + i * 150, [left ? "left" : "right"]: 90,
            transform: `translateX(${(1 - p) * (left ? -700 : 700)}px)`, opacity: p > 0.02 ? 1 : 0,
            display: "flex", alignItems: "center", gap: 22, padding: "26px 40px", borderRadius: 999,
            background: "rgba(255,255,255,0.1)", border: `2px solid ${C.line}`, backdropFilter: "blur(10px)",
          } as React.CSSProperties}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: C.accent }} />
            <div style={txt(58, 800, { letterSpacing: 0 })}>{ft}</div>
          </div>
        );
      })}
      <LightSweep at={120} dur={30} />
    </AbsoluteFill>
  );
};

// 12–20 s: the savings stack — each discount drops in as a bar, total rolls up and locks.
const Savings: React.FC<{ l: ListingProps }> = ({ l }) => {
  const f = useCurrentFrame();
  const tot = total(l); const max = Math.max(...l.discounts.map((d) => d.amount));
  const countStart = 30 + l.discounts.length * 60; const lockAt = countStart + 60;
  const rolled = tot * ease(f, countStart, lockAt);
  const pulse = interpolate(f - lockAt, [0, 6, 30], [0, 1, 0.35], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 60% at 50% 40%, #1a2133 0%, ${C.bg} 70%)` }}>
      <AbsoluteFill style={{
        opacity: 0.18, backgroundSize: "60px 60px",
        backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
        transform: `translateY(${-f * 0.6}px)`,
      }} />
      <div style={{ ...center, top: 400, ...txt(64, 900, { letterSpacing: 16 }), transform: `scale(${1.6 - 0.6 * slam(f, 0)})` }}>
        YOUR SAVINGS
      </div>
      {l.discounts.map((d, i) => {
        const at = 30 + i * 60; const p = slam(f, at); const w = ease(f, at + 4, at + 26);
        return (
          <div key={d.label} style={{
            position: "absolute", left: 90, right: 90, top: 600 + i * 200,
            transform: `translateY(${(1 - p) * -260}px)`, opacity: Math.min(1, p * 3),
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={txt(44, 700, { letterSpacing: 2, color: C.dim })}>{d.label.toUpperCase()}</div>
              <div style={txt(70, 900)}>{usd(d.amount * w)}</div>
            </div>
            <div style={{ height: 34, borderRadius: 17, background: "rgba(255,255,255,0.08)", marginTop: 18 }}>
              <div style={{
                height: "100%", borderRadius: 17, width: `${(d.amount / max) * 100 * w}%`,
                background: `linear-gradient(90deg, ${C.accent}, ${C.accent2})`,
              }} />
            </div>
          </div>
        );
      })}
      <div style={{
        position: "absolute", left: 90, right: 90, top: 600 + l.discounts.length * 200 + 10, height: 4,
        background: C.ink, opacity: 0.6, transformOrigin: "left", transform: `scaleX(${ease(f, countStart - 10, countStart + 8)})`,
      }} />
      <div style={{ ...center, top: 650 + l.discounts.length * 200, opacity: ease(f, countStart - 6, countStart + 4) }}>
        <div style={txt(44, 700, { letterSpacing: 12, color: C.accent })}>TOTAL SAVINGS</div>
        <div style={{
          ...txt(230, 900, { letterSpacing: -8 }), marginTop: 14,
          transform: `scale(${1 + 0.08 * pulse})`,
          textShadow: `0 0 ${60 * pulse}px rgba(255,106,26,${0.9 * pulse})`,
        }}>{usd(rolled)}</div>
        <div style={{ ...txt(46, 700, { letterSpacing: 10, color: C.dim }), marginTop: 18 }}>OFF MSRP</div>
      </div>
      <Flash at={lockAt} />
    </AbsoluteFill>
  );
};

// 20–24 s: eligibility programs — fanned cards, never added to the headline.
const Qualify: React.FC<{ l: ListingProps }> = ({ l }) => {
  const f = useCurrentFrame();
  const cards = l.ifQualify;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ ...center, top: 330, opacity: soft(f, 0, 10) }}>
        <div style={txt(56, 800, { letterSpacing: 6, color: C.dim })}>{cards.length ? "EVEN MORE" : "ASK ABOUT"}</div>
        <div style={{ ...txt(96, 900), marginTop: 14 }}>{cards.length ? "IF YOU QUALIFY" : "CURRENT OFFERS"}</div>
      </div>
      {cards.map((c, i) => {
        const p = slam(f, 15 + i * BEAT); const n = cards.length;
        const rot = n === 1 ? -3 : (i - (n - 1) / 2) * 7;
        return (
          <div key={c.label} style={{
            position: "absolute", left: 140, right: 140, top: 700 + i * 70, height: 420, borderRadius: 36,
            background: `linear-gradient(145deg, #1f2738, #121722)`, border: `3px solid ${C.accent}`,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 24,
            transform: `translateY(${(1 - p) * 900}px) rotate(${rot * p}deg)`,
          }}>
            <div style={txt(150, 900, { color: C.accent })}>+{usd(c.amount)}</div>
            <div style={{ ...txt(50, 800, { letterSpacing: 2 }), textAlign: "center", padding: "0 30px" }}>{c.label.toUpperCase()}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 24–28 s: Joey CTA with QR straight to this VIN's page.
const Cta: React.FC<{ l: ListingProps }> = ({ l }) => {
  const f = useCurrentFrame(); const sh = shake(f, 0, 12, 8);
  const initials = l.salesperson.split(" ").map((w) => w[0]).join("");
  return (
    <AbsoluteFill style={{ background: `radial-gradient(90% 60% at 50% 30%, #222b3f 0%, ${C.bg} 75%)` }}>
      <div style={{
        position: "absolute", left: 390, top: 260, width: 300, height: 300, borderRadius: 150, overflow: "hidden",
        border: `8px solid ${C.accent}`, transform: `translate(${sh.x}px,${sh.y}px) scale(${slam(f, 0)})`,
        background: "#2a3245", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {l.headshot
          ? <img src={staticFile(l.headshot)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ textAlign: "center" }}>
              <div style={txt(110, 900)}>{initials}</div>
              <div style={txt(18, 700, { letterSpacing: 3, color: C.dim, marginTop: 6 })}>HEADSHOT SLOT</div>
            </div>}
      </div>
      <div style={{ ...center, top: 610 }}>
        <div style={{ ...txt(48, 700, { letterSpacing: 14, color: C.accent }), opacity: soft(f, 6, 8) }}>ASK FOR</div>
        <div style={{ overflow: "hidden", marginTop: 14 }}>
          <div style={{ ...txt(108, 900, { letterSpacing: -3 }), transform: `translateY(${(1 - slam(f, BEAT)) * 110}%)` }}>
            {l.salesperson.toUpperCase()}
          </div>
        </div>
        <div style={{ ...txt(40, 600, { color: C.dim, letterSpacing: 1 }), marginTop: 18, opacity: soft(f, 22, 10) }}>
          {l.title} · Midlands Volkswagen of Columbia
        </div>
        <div style={{
          display: "inline-block", marginTop: 36, padding: "22px 54px", borderRadius: 999, background: C.accent,
          ...txt(64, 900, { letterSpacing: 1 }), transform: `scale(${slam(f, 2 * BEAT)})`,
        }}>{l.phone}</div>
      </div>
      <div style={{ ...center, top: 1110, transform: `scale(${slam(f, 3 * BEAT)})` }}>
        <QR text={l.url} size={300} />
        <div style={{ ...txt(34, 700, { color: C.dim, letterSpacing: 2 }), marginTop: 16 }}>
          SCAN TO SEE THIS {l.model.toUpperCase()}
        </div>
      </div>
      <Flash at={0} />
    </AbsoluteFill>
  );
};

// 28–30 s: end card + fine print.
const EndCard: React.FC<{ l: ListingProps }> = ({ l }) => {
  const f = useCurrentFrame();
  const qual = l.ifQualify.length ? ` ${l.ifQualify.map((q) => q.label).join(" and ")} savings shown separately and require program eligibility.` : "";
  return (
    <AbsoluteFill style={{ background: C.bg, opacity: soft(f, 0, 10) }}>
      <div style={{ ...center, top: 520 }}>
        <div style={txt(42, 700, { letterSpacing: 10, color: C.accent })}>MIDLANDS VOLKSWAGEN</div>
        <div style={{ ...txt(42, 700, { letterSpacing: 10, color: C.accent }), marginTop: 10 }}>OF COLUMBIA</div>
        <div style={{ ...txt(54, 800), marginTop: 50 }}>655 Broad River Rd</div>
        <div style={{ ...txt(54, 800), marginTop: 12 }}>Columbia, SC 29210</div>
        <div style={{ ...txt(54, 800, { color: C.dim }), marginTop: 40 }}>{l.phone}</div>
      </div>
      <div style={{
        position: "absolute", left: 90, right: 90, top: 1180, ...txt(25, 500, { color: "rgba(255,255,255,0.55)", letterSpacing: 0 }),
        lineHeight: 1.45, textAlign: "center",
      }}>
        Savings shown are off MSRP as listed on midlandsvw.com as of {l.asOf} for stock #{l.stock} (VIN {l.vin}).
        Total savings = {l.discounts.map((d) => `${d.label} ${usd(d.amount)}`).join(" + ")}.{qual} Retail Customer
        Bonus subject to program terms and end dates. Excludes tax, tag, title and dealer fees. Subject to prior
        sale. See dealer for complete details.
      </div>
    </AbsoluteFill>
  );
};

export const Listing: React.FC<ListingProps> = (l) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Audio src={staticFile("beat.wav")} />
    <Sequence from={T.hook} durationInFrames={T.reveal}><Hook l={l} /></Sequence>
    <Sequence from={T.reveal} durationInFrames={T.features - T.reveal}><Reveal l={l} /></Sequence>
    <Sequence from={T.features} durationInFrames={T.savings - T.features}><Features l={l} /></Sequence>
    <Sequence from={T.savings} durationInFrames={T.qualify - T.savings}><Savings l={l} /></Sequence>
    <Sequence from={T.qualify} durationInFrames={T.cta - T.qualify}><Qualify l={l} /></Sequence>
    <Sequence from={T.cta} durationInFrames={T.end - T.cta}><Cta l={l} /></Sequence>
    <Sequence from={T.end} durationInFrames={T.out - T.end}><EndCard l={l} /></Sequence>
    <Vignette />
    <Grain />
  </AbsoluteFill>
);
