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
  salesperson: string;
  title: string;
  phone: string;
  asOf: string;
};

const common = {
  salesperson: "Joey McDougal",
  title: "Sales Manager",
  phone: "803-404-5150",
  asOf: "10/29/26",
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
    features: ["7 Seats", "AWD", "2.0L TSI", "Sunroof", "Tow Package", "Orange-Stitch Interior"],
    // 01 = listing hero shot. 12 is a guess for an interior angle: open public/atlas-peak-539843/ and swap if needed.
    photos: ["atlas-peak-539843/01.webp", "atlas-peak-539843/12.webp"],
  },
];

export const total = (l: ListingProps) => l.discounts.reduce((s, d) => s + d.amount, 0);
export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
