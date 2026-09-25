import { useState, useEffect } from 'react';
import {
  Smartphone, ArrowRight, CheckCircle2, XCircle, Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { NETWORK_PROVIDERS, formatNaira, generateOrderRef } from '@/lib/constants';
import WalletBanner from '@/components/dashboard/WalletBanner';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [amount, setAmount] = useState<number | ''>('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (profile?.phone) setRecipient(profile.phone);
  }, [profile]);

  const numAmount = typeof amount === 'number' ? amount : 0;
  const balance = Number(profile?.wallet_balance || 0);
  const insufficient = numAmount > 0 && numAmount > balance;

  const handlePurchase = async () => {
    if (!user || !numAmount || !recipient) return;
    if (numAmount < 50) {
      setResult({ success: false, message: 'Minimum airtime amount is ₦50.' });
      return;
    }
    if (!recipient.match(/^0\d{10}$/)) {
      setResult({ success: false, message: 'Please enter a valid phone number (e.g., 08012345678).' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const orderRef = generateOrderRef();
      const { data } = await supabase
        .from('service_catalog')
        .select('product_code')
        .eq('service_type', 'airtime')
        .eq('provider_code', selectedNetwork)
        .maybeSingle();

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-airtime`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operator_id: data?.product_code || selectedNetwork,
          amount: numAmount,
          recipient,
          recipient_phone: recipient,
          order_ref: orderRef,
        }),
      });

      const json = await resp.json();

      if (json.success) {
        setResult({ success: true, message: json.message || `Airtime of ${formatNaira(numAmount)} delivered to ${recipient}` });
        setAmount('');
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

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Buy Airtime</h1>
        <p className="text-slate-600 mt-1">Top up any Nigerian network instantly.</p>
      </div>

      <WalletBanner insufficient={insufficient} requiredAmount={numAmount} />

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
        {/* Network selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Select Network</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {NETWORK_PROVIDERS.map((provider) => (
              <button
                key={provider.code}
                onClick={() => setSelectedNetwork(provider.code)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                  selectedNetwork === provider.code
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: provider.color }}>
                  {provider.logo.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-slate-700">{provider.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Phone number */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
          <div className="relative">
            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="tel"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="08012345678"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₦</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="Enter amount"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-slate-900 placeholder-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  amount === amt
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {formatNaira(amt)}
              </button>
            ))}
          </div>
        </div>

        {numAmount > 0 && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
            <span className="text-sm text-slate-600">You will be charged</span>
            <span className="text-lg font-heading font-bold text-slate-900">{formatNaira(numAmount)}</span>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading || !numAmount || !recipient || insufficient}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Buy Airtime
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {numAmount > 0 && numAmount < 50 && (
          <p className="text-sm text-error-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Minimum airtime purchase is ₦50.
          </p>
        )}
      </div>
    </div>
  );
}
