import type { NetworkProvider } from '@/types';

export const NETWORK_PROVIDERS: NetworkProvider[] = [
  { code: 'MTN', label: 'MTN', color: '#FFCC00', logo: 'MTN', reloadly_operator_id: 0 },
  { code: 'AIRTEL', label: 'Airtel', color: '#E60012', logo: 'Airtel', reloadly_operator_id: 0 },
  { code: 'GLO', label: 'Glo', color: '#00A651', logo: 'Glo', reloadly_operator_id: 0 },
  { code: '9MOBILE', label: '9mobile', color: '#0066B3', logo: '9mobile', reloadly_operator_id: 0 },
  { code: 'SPECTRANET', label: 'Spectranet', color: '#E4002B', logo: 'Spectranet', reloadly_operator_id: 0 },
  { code: 'SMILE', label: 'Smile', color: '#FF6B00', logo: 'Smile', reloadly_operator_id: 0 },
];

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'NGN') return formatNaira(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateOrderRef(): string {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
