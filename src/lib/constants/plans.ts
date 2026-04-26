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
    id: 'BASIC',
    name: 'Basic',
    price: '₹499',
    priceNumeric: 499,
    months: 1,
    period: '/ 30 days',
    features: ['Unlimited Interests', 'View Contact Details (10)', 'Basic Support', 'Mobile-only App Access'],
    cta: 'Get Basic',
    style: 'btn-secondary',
    badge: '',
  },
  {
    id: 'PRIME',
    name: 'Prime',
    price: '₹1,100',
    priceNumeric: 1100,
    months: 3,
    period: '/ 90 days',
    features: ['Priority Profile', 'View Contact Details (50)', 'Dedicated Matchmaker', 'Everything in Basic'],
    cta: 'Go Prime',
    style: 'btn-primary',
    badge: 'Recommended',
  },
  {
    id: 'ELITE',
    name: 'Elite',
    price: '₹1,999',
    priceNumeric: 1999,
    months: 6,
    period: '/ 180 days',
    features: ['Personalized Scouting', 'Unlimited Contacts', '24/7 Priority Support', 'Everything in Prime'],
    cta: 'Join Elite',
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
