import { useState, useEffect } from 'react';
import {
  Wifi, ArrowRight, CheckCircle2, XCircle, Loader2, Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { NETWORK_PROVIDERS, formatNaira, generateOrderRef } from '@/lib/constants';
import WalletBanner from '@/components/dashboard/WalletBanner';
import type { ServiceCatalogItem } from '@/types';

export default function DataPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [plans, setPlans] = useState<ServiceCatalogItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ServiceCatalogItem | null>(null);
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (profile?.phone) setRecipient(profile.phone);
  }, [profile]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('service_catalog')
        .select('*')
        .eq('service_type', 'data')
        .eq('provider_code', selectedNetwork)
        .eq('is_active', true)
        .order('amount', { ascending: true });
      setPlans((data as ServiceCatalogItem[]) || []);
      setSelectedPlan(null);
    })();
  }, [selectedNetwork]);

  const balance = Number(profile?.wallet_balance || 0);
  const insufficient = selectedPlan && Number(selectedPlan.amount) > balance;

  const handlePurchase = async () => {
    if (!user || !selectedPlan || !recipient) return;
    if (!recipient.match(/^0\d{10}$/)) {
      setResult({ success: false, message: 'Please enter a valid phone number (e.g., 08012345678).' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const orderRef = generateOrderRef();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reloadly-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operator_id: selectedPlan.provider_code,
          product_code: selectedPlan.product_code,
          amount: Number(selectedPlan.amount),
          recipient,
          recipient_phone: recipient,
          order_ref: orderRef,
        }),
      });

      const json = await resp.json();

      if (json.success) {
        setResult({ success: true, message: json.message || `Data bundle delivered to ${recipient}` });
        setSelectedPlan(null);
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

  const dataNetworks = NETWORK_PROVIDERS.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Buy Data</h1>
        <p className="text-slate-600 mt-1">Affordable data bundles for any network.</p>
      </div>

      <WalletBanner insufficient={!!insufficient} requiredAmount={selectedPlan ? Number(selectedPlan.amount) : undefined} />

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
          <div className="grid grid-cols-4 gap-3">
            {dataNetworks.map((provider) => (
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
                  {provider.label.slice(0, 2).toUpperCase()}
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
            <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="tel"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="08012345678"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Data plans */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Select Data Plan</label>
          {plans.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
              <Wifi className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No data plans available for {selectedNetwork}.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPlan?.id === plan.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading font-semibold text-slate-900">{plan.label}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {plan.provider_code}
                      </div>
                    </div>
                    <p className="font-heading font-bold text-primary-600">{formatNaira(Number(plan.amount))}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPlan && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
            <div>
              <span className="text-sm text-slate-600">You will be charged</span>
              <p className="text-xs text-slate-400 mt-0.5">{selectedPlan.label}</p>
            </div>
            <span className="text-lg font-heading font-bold text-slate-900">{formatNaira(Number(selectedPlan.amount))}</span>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading || !selectedPlan || !recipient || !!insufficient}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Buy Data
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
