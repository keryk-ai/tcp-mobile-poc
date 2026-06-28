export interface DemoLineItem {
  description: string;
  price: number;
  uom: string;
  qtyPerDay: number;
  days: number;
  totalQty: number;
  total: number;
}

export interface DemoSite {
  id: string;
  type: 'scheduled' | 'completed';
  jobName: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  customer: string;
  documentId: string;
  documentDate: string;
  validThrough?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  estimatedDays: number;
  lineItems: DemoLineItem[];
  equipment: number;
  oneTimeCharges: number;
  labor: number;
  subtotal: number;
  salesTax: number;
  total: number;
  notes: string;
  planDescription: string;
}

const AWP_LINE_ITEMS: DemoLineItem[] = [
  { description: '28" Traffic Cone', price: 0.50, uom: 'Per Day', qtyPerDay: 110, days: 1, totalQty: 110, total: 55.00 },
  { description: 'Sign Stand Only', price: 0.75, uom: 'Per Day', qtyPerDay: 12, days: 1, totalQty: 12, total: 9.00 },
  { description: 'Traffic Sign Small (<10 Sq. Ft.) - BE PREPARED TO STOP', price: 0.65, uom: 'Per Day', qtyPerDay: 2, days: 1, totalQty: 2, total: 1.30 },
  { description: 'Traffic Sign Small (<10 Sq. Ft.) - END ROAD WORK', price: 0.65, uom: 'Per Day', qtyPerDay: 2, days: 1, totalQty: 2, total: 1.30 },
  { description: 'Traffic Sign Small (<10 Sq. Ft.) - FLAGGER AHEAD', price: 0.65, uom: 'Per Day', qtyPerDay: 3, days: 1, totalQty: 3, total: 1.95 },
  { description: 'Traffic Sign Small (<10 Sq. Ft.) - ONE LANE ROAD AHEAD', price: 0.65, uom: 'Per Day', qtyPerDay: 2, days: 1, totalQty: 2, total: 1.30 },
  { description: 'Traffic Sign Small (<10 Sq. Ft.) - ROAD WORK AHEAD', price: 0.65, uom: 'Per Day', qtyPerDay: 3, days: 1, totalQty: 3, total: 1.95 },
  { description: 'Flag w/ Dowel', price: 2.75, uom: 'Per Each', qtyPerDay: 24, days: 1, totalQty: 24, total: 66.00 },
  { description: 'Sandbag', price: 1.50, uom: 'Per Each', qtyPerDay: 24, days: 1, totalQty: 24, total: 36.00 },
  { description: 'Deliver/Travel Charge Zone A', price: 135.00, uom: 'Per Each', qtyPerDay: 1, days: 1, totalQty: 1, total: 135.00 },
  { description: 'Flagging Employee - Hourly', price: 60.00, uom: 'Per Hour', qtyPerDay: 40, days: 1, totalQty: 40, total: 2400.00 },
  { description: 'Pick up/Travel Charge Zone A', price: 135.00, uom: 'Per Each', qtyPerDay: 1, days: 1, totalQty: 1, total: 135.00 },
  { description: 'Traffic Control Employee - Hourly', price: 75.00, uom: 'Per Hour', qtyPerDay: 3, days: 1, totalQty: 3, total: 225.00 },
];

export const DEMO_SITES: DemoSite[] = [
  {
    id: 'demo-scheduled-001',
    type: 'scheduled',
    jobName: '59258992',
    address: '7936 OLD SALISBURY RD',
    city: 'Linwood, NC 27299',
    lat: 35.492,
    lng: -80.431,
    customer: 'Duke Energy',
    documentId: '105G',
    documentDate: '6/28/2026',
    validThrough: '7/28/2026',
    scheduledDate: 'July 15, 2026',
    scheduledTime: '7:00 AM',
    estimatedDays: 1,
    lineItems: AWP_LINE_ITEMS,
    equipment: 71.80,
    oneTimeCharges: 102.00,
    labor: 2895.00,
    subtotal: 3068.80,
    salesTax: 198.20,
    total: 3267.00,
    notes: 'The * indicates taxable items.',
    planDescription: 'TA-10 traffic control plan with flaggers.',
  },
  {
    id: 'demo-completed-001',
    type: 'completed',
    jobName: '48392017',
    address: '4400 SHARON RD',
    city: 'Charlotte, NC 28211',
    lat: 35.175,
    lng: -80.819,
    customer: 'Verizon',
    documentId: 'INV-2847',
    documentDate: '6/15/2026',
    completedDate: 'June 15, 2026',
    estimatedDays: 1,
    lineItems: AWP_LINE_ITEMS,
    equipment: 71.80,
    oneTimeCharges: 102.00,
    labor: 2895.00,
    subtotal: 3068.80,
    salesTax: 198.20,
    total: 3267.00,
    notes: 'The * indicates taxable items.',
    planDescription: 'TA-10 traffic control plan with flaggers.',
  },
];
