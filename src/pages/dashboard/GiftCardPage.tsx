import { useState, useEffect } from 'react';
import {
  Gift, ArrowRight, CheckCircle2, XCircle, Loader2, Mail, Minus, Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNaira, generateOrderRef } from '@/lib/constants';
import WalletBanner from '@/components/dashboard/WalletBanner';
import type { ServiceCatalogItem } from '@/types';

const BRAND_COLORS: Record<string, string> = {
  AMAZON: '#FF9900',
  GOOGLEPLAY: '#4285F4',
  ITUNES: '#FC3F1D',
  STEAM: '#1B2838',
  EBAY: '#E53238',
  SEPHORA: '#000000',
  NETFLIX: '#E50914',
  SPOTIFY: '#1DB954',
  XBOX: '#107C10',
  PLAYSTATION: '#003791',
  WALMART: '#0071CE',
};

const USD_TO_NAIRA = 1500;

export default function GiftCardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [cards, setCards] = useState<ServiceCatalogItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<ServiceCatalogItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('service_catalog')
        .select('*')
        .eq('service_type', 'giftcard')
        .eq('is_active', true)
        .order('provider_code', { ascending: true });
      setCards((data as ServiceCatalogItem[]) || []);
    })();
  }, []);

  useEffect(() => {
    if (user?.email) setRecipientEmail(user.email);
  }, [user]);

  const unitPriceNaira = selectedCard ? Number(selectedCard.amount) * USD_TO_NAIRA : 0;
  const totalCost = unitPriceNaira * quantity;
  const balance = Number(profile?.wallet_balance || 0);
  const insufficient = totalCost > balance;

  const handlePurchase = async () => {
    if (!user || !selectedCard || !recipientEmail) return;
    if (!recipientEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setResult({ success: false, message: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const orderRef = generateOrderRef();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-giftcard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: selectedCard.product_code,
          amount: quantity,
          unit_price: unitPriceNaira,
          recipient_email: recipientEmail,
          order_ref: orderRef,
        }),
      });

      const json = await resp.json();

      if (json.success) {
        setResult({ success: true, message: `Gift card sent to ${recipientEmail}. Check your email for the card details.` });
        setSelectedCard(null);
        setQuantity(1);
        refreshProfile();
      } else {
        setResult({ success: false, message: json.error || 'Purchase failed. Please try again.' });
        refreshProfile();
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const brandColor = (code: string) => BRAND_COLORS[code] || '#64748b';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Buy Gift Cards</h1>
        <p className="text-slate-600 mt-1">Gift cards from top global brands, delivered by email.</p>
      </div>

      <WalletBanner insufficient={insufficient} requiredAmount={totalCost} />

      {result && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${
          result.success
            ? 'bg-success-50 border-success-200 text-success-700'
            : 'bg-error-50 border-error-200 text-error-700'
        }`}>
          {result.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium">{result.message}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        {/* Brand selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Select Gift Card</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  selectedCard?.id === card.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: brandColor(card.provider_code) }}>
                  <Gift className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">{card.label}</span>
                <span className="text-xs text-slate-400">from {formatCurrency(Number(card.amount), card.currency)}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedCard && (
          <>
            {/* Recipient email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Recipient Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">The gift card code will be sent to this email address.</p>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-600 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-xl font-heading font-bold text-slate-900 w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-11 h-11 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Card value</span>
                <span className="text-slate-900 font-medium">{formatCurrency(Number(selectedCard.amount), selectedCard.currency)} ({formatNaira(unitPriceNaira)})</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Quantity</span>
                <span className="text-slate-900 font-medium">{quantity}</span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Total Cost</span>
                <span className="text-lg font-heading font-bold text-slate-900">{formatNaira(totalCost)}</span>
              </div>
            </div>
          </>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading || !selectedCard || !recipientEmail || insufficient}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Buy Gift Card
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
