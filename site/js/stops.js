// The stops along the lot, in driving order: the entrance, one bay per car (from data/cars.js),
// then the showroom. Adding a car to the data adds a bay; nothing here needs editing.
//   start/end  scroll-progress range of the stop (ranges tile 0..1)
//   hold       where carousel/keyboard navigation parks the camera
//   anchor     world position of the stop (metres)
//   cam        camera keys [t, position, look-at], t is 0..1 inside the range
export const CARS = window.CARS.cars;
export const BAY_GAP = 7;
export const BAY_Z = -9;
export const bayX = (i) => 34 + i * BAY_GAP;
export const SHOWROOM_X = bayX(CARS.length - 1) + 40;

const ENDS = 0.07;
const per = (1 - 2 * ENDS) / CARS.length;

export const STOPS = [
  {
    id: 'home', label: 'THE LOT', start: 0, end: ENDS, holdT: 0.3, anchor: [0, 0, 0],
    cam: [[0, [-20, 4.6, 26], [10, 4.4, -6]], [0.3, [-14, 3.4, 20], [14, 4.0, -7]], [1, [bayX(0) - 8, 3.1, 9], [bayX(0) - 1.2, 1.9, BAY_Z]]],
  },
  ...CARS.map((car, i) => {
    const x = bayX(i);
    return {
      id: car.id, car, index: i, label: `${car.model} ${car.trim}`.toUpperCase(),
      start: ENDS + i * per, end: ENDS + (i + 1) * per, holdT: 0.5, anchor: [x, 0, BAY_Z],
      cam: [[0.12, [x - 3.8, 3.0, 8.4], [x - 0.8, 1.8, BAY_Z]], [0.5, [x + 0.5, 2.9, 7.4], [x + 0.4, 1.9, BAY_Z]], [0.88, [x + 3.8, 3.0, 8.2], [x + 1.0, 1.8, BAY_Z]]],
    };
  }),
  {
    id: 'visit', label: 'VISIT', start: 1 - ENDS, end: 1, holdT: 0.65, anchor: [SHOWROOM_X, 0, -14],
    cam: [[0.1, [SHOWROOM_X - 40, 3.2, 14], [SHOWROOM_X - 18, 4.6, -10]], [0.65, [SHOWROOM_X - 30, 3.6, 21], [SHOWROOM_X - 12, 5.2, -11]], [1, [SHOWROOM_X - 14, 10, 40], [SHOWROOM_X - 8, 4, -12]]],
  },
];
STOPS.forEach((s) => { s.hold = s.start + s.holdT * (s.end - s.start); });

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const stopIndexAt = (p) => { for (let i = STOPS.length - 1; i >= 0; i--) if (p >= STOPS[i].start) return i; return 0; };
export const stopIndex = (id) => STOPS.findIndex((s) => s.id === id);

// 0..1 presence of a stop's overlay at progress p.
export function activity(i, p) {
  const s = STOPS[i];
  const fin = i === 0 ? 1 : smooth(s.start + 0.002, s.start + 0.018, p);
  const fout = i === STOPS.length - 1 ? 1 : 1 - smooth(s.end - 0.018, s.end - 0.002, p);
  return Math.min(fin, fout);
}

export const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
