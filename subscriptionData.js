// Placeholder subscription/retainer pricing — Vistaar Media has no public
// pricing page anywhere (checked vistaarverse.com, vistaar.media and their
// Instagram), so these numbers and feature lists are illustrative only.
// Replace PLANS below with the real plan names, prices and inclusions
// whenever they're finalized; every plan applies to whichever service the
// visitor picked on the selection screen (subscription.js sets the heading).

export const CONTACT_EMAIL = 'vistaarmedia@gmail.com';

export const PLANS = [
  {
    name: 'Starter',
    tagline: 'For brands testing the waters with a steady content drop.',
    monthly: 15000,
    yearly: 150000,
    popular: false,
    features: [
      '4 deliverables per month',
      'Concept + shot list from us',
      '1 revision round',
      'Delivery in 7 business days',
    ],
  },
  {
    name: 'Growth',
    tagline: 'Our most-booked plan — consistent output with real strategy behind it.',
    monthly: 35000,
    yearly: 350000,
    popular: true,
    features: [
      '10 deliverables per month',
      'Monthly content strategy call',
      '2 revision rounds',
      'Priority scheduling',
      'Delivery in 4 business days',
    ],
  },
  {
    name: 'Pro',
    tagline: 'For teams that need a dedicated creative partner on tap.',
    monthly: 65000,
    yearly: 650000,
    popular: false,
    features: [
      'Unlimited shoots (fair-use)',
      'Dedicated creative lead',
      'Unlimited revisions',
      'Same-week delivery',
      'Quarterly strategy review',
    ],
  },
];

// Row-by-row breakdown of the same three plans, for the comparison table
// under the plan cards. Each row's `values` line up with PLANS' order
// (Starter, Growth, Pro); a boolean renders as a check/cross, a string
// renders as-is — some things (deliverable counts, turnaround time) are
// more honest as a number than a yes/no.
export const COMPARISON_FEATURES = [
  { name: 'Deliverables per month', values: ['4', '10', 'Unlimited (fair-use)'] },
  { name: 'Concept & shot list', values: [true, true, true] },
  { name: 'Monthly strategy call', values: [false, true, true] },
  { name: 'Revision rounds', values: ['1', '2', 'Unlimited'] },
  { name: 'Priority scheduling', values: [false, true, true] },
  { name: 'Turnaround time', values: ['7 business days', '4 business days', 'Same week'] },
  { name: 'Dedicated creative lead', values: [false, false, true] },
  { name: 'Quarterly strategy review', values: [false, false, true] },
];
