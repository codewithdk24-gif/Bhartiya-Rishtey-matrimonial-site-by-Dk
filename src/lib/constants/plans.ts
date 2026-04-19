export interface Plan {
  id: string;
  name: string;
  price: string;
  priceNumeric: number;
  months: number;
  period: string;
  features: string[];
  cta: string;
  style: 'btn-secondary' | 'btn-primary' | 'btn-gold';
  badge: string;
}

export const PLANS: Plan[] = [
  {
    id: 'PRIME',
    name: 'Prime',
    price: '₹1,100',
    priceNumeric: 1100,
    months: 3,
    period: '/ 3 months',
    features: ['View unlimited profiles', 'Send personalized messages', 'View contact details', 'Advanced search filters', 'Priority profile listing'],
    cta: 'Start Prime',
    style: 'btn-secondary',
    badge: '',
  },
  {
    id: 'ROYAL',
    name: 'Royal',
    price: '₹2,100',
    priceNumeric: 2100,
    months: 6,
    period: '/ 6 months',
    features: ['Everything in Prime', 'Profile booster', 'Global access', 'Dedicated Relationship Manager', 'Direct WhatsApp support'],
    cta: 'Go Royal',
    style: 'btn-primary',
    badge: 'Recommended',
  },
  {
    id: 'LEGACY',
    name: 'Legacy',
    price: '₹3,100',
    priceNumeric: 3100,
    months: 12,
    period: '/ 1 year',
    features: ['Everything in Royal', 'Unlimited video calls', 'Invisible mode', 'Featured profile (VIP)', 'Zero Commission assisted services'],
    cta: 'Join Legacy',
    style: 'btn-gold',
    badge: 'Best Value',
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find(p => p.id === id);
}

export function getPlanByPrice(amount: number): Plan | undefined {
  return PLANS.find(p => p.priceNumeric === amount);
}
