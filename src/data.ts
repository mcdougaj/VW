// One entry per listing. Discounts only — never a price on screen.
// Source: midlandsvw.com, pulled 2026-10-29. Re-check every number before posting.
export type Money = { label: string; amount: number };
export type ListingProps = {
  id: string;
  year: number;
  model: string;
  trim: string;
  stock: string;
  vin: string;
  url: string;
  discounts: Money[];     // apply to every retail buyer -> headline total
  ifQualify: Money[];     // eligibility programs, shown separately, never added to the headline
  features: string[];
  photos: string[];       // files under public/; empty -> marked placeholder slot
  headshot?: string;
  bonusEnds?: string;     // Retail Customer Bonus expiry from the listing ("Exp. MM/DD/YYYY"), printed on the end card
  captions: boolean;      // false -> clean render for captioning in DaVinci Resolve
  salesperson: string;
  title: string;
  phone: string;
  asOf: string;
};

const common = {
  salesperson: "Joey McDougal",
  title: "Sales Manager",
  phone: "803-404-5150",
  headshot: "joey.jpg",
  asOf: "10/29/26",
  captions: true,
};

export const listings: ListingProps[] = [
  {
    ...common,
    id: "atlas-peak-539843",
    year: 2026,
    model: "Atlas",
    trim: "Peak Edition AWD",
    stock: "V36200",
    vin: "1V2CN2CA3TC539843",
    url: "https://www.midlandsvw.com/inventory/new-2026-volkswagen-atlas-peak-edition-awd-4d-sport-utility-1v2cn2ca3tc539843/",
    discounts: [
      { label: "Dealer Discount", amount: 1615 },
      { label: "Retail Customer Bonus", amount: 5000 },
    ],
    ifQualify: [{ label: "Military & First Responders", amount: 500 }],
    // Verified against the listing spec sheet 2026-10-29: 7 passengers, full-time AWD, 2.0L TSI 269 hp,
    // panoramic 1st/2nd-row sunroof, 5,000-lb max trailering (wiring harness listed, no "tow package" line).
    features: ["7 Seats", "AWD", "269-HP 2.0L TSI", "Panoramic Sunroof", "Tows 5,000 lbs", "Orange-Stitch Interior"],
    bonusEnds: "11/02/26",
    // 02 = clean front 3/4 (01 has the dealer banner burned in). 08 = front seats showing the orange stitching.
    photos: ["atlas-peak-539843/02.webp", "atlas-peak-539843/08.webp"],
  },
];

export const total = (l: ListingProps) => l.discounts.reduce((s, d) => s + d.amount, 0);
export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
