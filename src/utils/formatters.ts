import { Currency } from '../types';

export function formatCurrency(amount: number, currency: Currency = 'TOMAN'): string {
  if (currency === 'TOMAN') {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  } else {
    // Approx conversion for demo: 1 USD = 70,000 Toman
    const usd = amount / 70000;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 1 }).format(usd);
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num);
}

export function formatPercent(num: number): string {
  return `${num.toFixed(1)}٪`;
}
