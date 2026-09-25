export type ServiceType = 'airtime' | 'data' | 'giftcard';
export type OrderStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type TransactionType = 'funding' | 'purchase' | 'refund' | 'bonus';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceCatalogItem {
  id: string;
  service_type: ServiceType;
  provider_code: string;
  product_code: string;
  label: string;
  amount: number | null;
  currency: string;
  is_active: boolean;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  reference: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  service_type: ServiceType;
  product_code: string;
  recipient: string;
  amount: number;
  status: OrderStatus;
  provider_ref: string;
  provider_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentReference {
  id: string;
  user_id: string;
  reference: string;
  amount: number;
  provider: string;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
}

export interface NetworkProvider {
  code: string;
  label: string;
  color: string;
  logo: string;
  reloadly_operator_id: number;
}

export interface SavedCard {
  id: string;
  user_id: string;
  authorization_code: string;
  card_type: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  bank: string;
  brand: string;
  is_active: boolean;
  created_at: string;
}
