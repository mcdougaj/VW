import { STOPS, clamp01 } from './stops.js?v=45891da-mvu89vzw';

// Virtual scroll (same feel as joeyi.org): wheel, touch and keys move a target progress 0..1; value eases toward it.
export function createScroll(initial = 0) {
  const s = { value: initial, target: initial, velocity: 0, locked: false };
  const WHEEL = 1 / 16000;
  const TOUCH = 1 / 3600;
  const stops = STOPS.map((st) => st.hold);
  const moved = () => document.body.classList.add('moved');

  s.step = (dir) => {
    const eps = 0.004;
    const next = dir > 0 ? stops.find((h) => h > s.target + eps) : [...stops].reverse().find((h) => h < s.target - eps);
    s.target = next ?? (dir > 0 ? 1 : 0);
    moved();
  };
  s.jumpTo = (p, instant = false) => { s.target = clamp01(p); if (instant) s.value = s.target; moved(); };
  s.update = (dt) => {
    const prev = s.value;
    s.value += (s.target - s.value) * (1 - Math.exp(-dt * 3.0));
    if (Math.abs(s.target - s.value) < 1e-5) s.value = s.target;
    s.velocity = (s.value - prev) / Math.max(dt, 1e-4);
  };

  const inUi = (e) => e.target.closest && e.target.closest('.detail, .carousel, dialog');
  addEventListener('wheel', (e) => {
    if (s.locked || inUi(e)) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1;
    s.target = clamp01(s.target + Math.max(-240, Math.min(240, e.deltaY * unit)) * WHEEL);
    moved();
  }, { passive: false });

  let touchY = null;
  addEventListener('touchstart', (e) => { touchY = inUi(e) ? null : e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (s.locked || touchY === null) return;
    const y = e.touches[0].clientY;
    s.target = clamp01(s.target + (touchY - y) * TOUCH);
    touchY = y;
    moved();
    e.preventDefault();
  }, { passive: false });
  addEventListener('touchend', () => {
    // settle on the nearest stop so a swipe always lands on a car
    if (touchY !== null && !s.locked) {
      const near = stops.reduce((a, b) => (Math.abs(b - s.target) < Math.abs(a - s.target) ? b : a));
      if (Math.abs(near - s.target) < 0.03) s.target = near;
    }
    touchY = null;
  }, { passive: true });

  addEventListener('keydown', (e) => {
    if (s.locked || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input,textarea,select,video,.detail')) return;
    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': case 'PageDown': s.step(1); break;
      case 'ArrowUp': case 'ArrowLeft': case 'PageUp': s.step(-1); break;
      case ' ': if (e.target.closest && e.target.closest('a,button')) return; s.step(e.shiftKey ? -1 : 1); break;
      case 'Home': s.jumpTo(0); break;
      case 'End': s.jumpTo(1); break;
      default: return;
    }
    e.preventDefault();
  });
  return s;
}
