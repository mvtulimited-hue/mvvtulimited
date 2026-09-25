import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet, ArrowRight, Loader2, CheckCircle2, XCircle,
  CreditCard, ShieldCheck, Plus, TrendingUp, TrendingDown,
  Trash2, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate } from '@/lib/constants';
import type { WalletTransaction, PaymentReference, SavedCard } from '@/types';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

export default function WalletPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState<number | ''>(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'failed'; msg: string } | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payments, setPayments] = useState<PaymentReference[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [charging, setCharging] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    const ref = searchParams.get('ref');
    if (status === 'success') {
      setStatusMsg({ type: 'success', msg: `Payment successful! Your wallet has been funded. Reference: ${ref}` });
      refreshProfile();
    } else if (status === 'failed') {
      setStatusMsg({ type: 'failed', msg: `Payment failed or was cancelled. Reference: ${ref}` });
    }
  }, [searchParams, refreshProfile]);

  const fetchCards = async () => {
    if (!user) return;
    const { data: cards } = await supabase
      .from('saved_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    const cardList = (cards as SavedCard[]) || [];
    setSavedCards(cardList);
    if (cardList.length > 0 && !selectedCardId) {
      setSelectedCardId(cardList[0].id);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: tx } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setTransactions((tx as WalletTransaction[]) || []);

      const { data: pays } = await supabase
        .from('payment_references')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setPayments((pays as PaymentReference[]) || []);

      await fetchCards();
    })();
  }, [user]);

  const numAmount = typeof amount === 'number' ? amount : 0;

  const handleFundNewCard = async () => {
    if (!user || !numAmount) return;
    if (numAmount < 100) {
      setError('Minimum funding amount is ₦100.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMsg(null);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numAmount,
          email: user.email,
        }),
      });

      const json = await resp.json();

      if (json.error) {
        setError(json.error);
      } else if (json.authorization_url) {
        window.location.href = json.authorization_url;
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFundSavedCard = async () => {
    if (!user || !numAmount || !selectedCardId) return;
    if (numAmount < 100) {
      setError('Minimum funding amount is ₦100.');
      return;
    }

    setCharging(true);
    setError(null);
    setStatusMsg(null);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-charge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numAmount,
          email: user.email,
          card_id: selectedCardId,
        }),
      });

      const json = await resp.json();

      if (json.success) {
        setStatusMsg({ type: 'success', msg: `Wallet funded with ${formatNaira(numAmount)} instantly!` });
        setAmount('');
        await refreshProfile();
        // Refresh transactions
        const { data: tx } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        setTransactions((tx as WalletTransaction[]) || []);
      } else {
        setError(json.error || 'Card charge failed. Please try again.');
        if (json.card_deactivated) {
          await fetchCards();
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCharging(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    setDeletingCardId(cardId);
    try {
      await supabase
        .from('saved_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user?.id);
      await fetchCards();
      if (selectedCardId === cardId) {
        setSelectedCardId(savedCards.find(c => c.id !== cardId)?.id || null);
      }
    } catch {
      // ignore
    } finally {
      setDeletingCardId(null);
    }
  };

  const totalIn = transactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOut = transactions
    .filter((t) => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const selectedCard = savedCards.find(c => c.id === selectedCardId);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Wallet</h1>
        <p className="text-slate-600 mt-1">Fund your wallet and track your balance.</p>
      </div>

      {/* Status messages from Paystack redirect or saved card charge */}
      {statusMsg && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${
          statusMsg.type === 'success'
            ? 'bg-success-50 border-success-200 text-success-700'
            : 'bg-error-50 border-error-200 text-error-700'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium">{statusMsg.msg}</span>
        </div>
      )}

      {/* Balance card */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-100 font-medium">Current Balance</p>
              <p className="text-4xl font-heading font-bold mt-2">{formatNaira(Number(profile?.wallet_balance || 0))}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Wallet className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-success-300">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Total Funded</span>
              </div>
              <p className="text-lg font-heading font-bold mt-1">{formatNaira(totalIn)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-error-300">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-medium">Total Spent</span>
              </div>
              <p className="text-lg font-heading font-bold mt-1">{formatNaira(totalOut)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fund wallet form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-slate-900">Fund Wallet</h3>
            <p className="text-sm text-slate-500">Add money via Paystack — secure and instant.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-error-50 border border-error-100 text-error-700 text-sm">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Saved cards */}
        {savedCards.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Your Saved Cards</label>
            <div className="space-y-2">
              {savedCards.map((card) => (
                <div
                  key={card.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCardId === card.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedCardId(card.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 capitalize">
                        {card.card_type || card.brand || 'Card'} •••• {card.last4}
                      </p>
                      <p className="text-xs text-slate-500">
                        {card.bank || 'Bank'}{card.exp_month && card.exp_year ? ` · ${card.exp_month}/${card.exp_year}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCardId === card.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary-600" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                      disabled={deletingCardId === card.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-error-600 hover:bg-error-50 transition-colors disabled:opacity-50"
                      title="Remove card"
                    >
                      {deletingCardId === card.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₦</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="Enter amount (min ₦100)"
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

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-success-500" />
          Payments secured by Paystack. Your card details are never stored on our servers.
        </div>

        {/* Primary action: charge saved card if one is selected */}
        {selectedCard && savedCards.length > 0 ? (
          <div className="space-y-3">
            <button
              onClick={handleFundSavedCard}
              disabled={charging || !numAmount}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {charging ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Charging your card...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Fund {numAmount ? formatNaira(numAmount) : ''} with {selectedCard.card_type || 'Card'} •••• {selectedCard.last4}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <button
              onClick={handleFundNewCard}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-semibold text-sm transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to Paystack...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Use a new card
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleFundNewCard}
            disabled={loading || !numAmount}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to Paystack...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Fund with Paystack
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Recent funding payments */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-heading font-semibold text-slate-900">Funding History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {payments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    pay.status === 'success' ? 'bg-success-50' : pay.status === 'failed' ? 'bg-error-50' : 'bg-warning-50'
                  }`}>
                    {pay.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-success-600" /> : <CreditCard className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{formatNaira(Number(pay.amount))}</p>
                    <p className="text-xs text-slate-500">{formatDate(pay.created_at)}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold capitalize px-3 py-1 rounded-full ${
                  pay.status === 'success' ? 'bg-success-100 text-success-700' :
                  pay.status === 'failed' ? 'bg-error-100 text-error-700' : 'bg-warning-100 text-warning-700'
                }`}>
                  {pay.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent wallet transactions */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-heading font-semibold text-slate-900">Wallet Transactions</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No transactions yet.</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    Number(tx.amount) > 0 ? 'bg-success-50' : 'bg-error-50'
                  }`}>
                    <span className={`text-sm font-bold ${Number(tx.amount) > 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {Number(tx.amount) > 0 ? '+' : '−'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{tx.type}</p>
                    <p className="text-xs text-slate-500">{tx.description || formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${Number(tx.amount) > 0 ? 'text-success-600' : 'text-slate-900'}`}>
                    {Number(tx.amount) > 0 ? '+' : ''}{formatNaira(Number(tx.amount))}
                  </p>
                  <p className="text-xs text-slate-400">{formatNaira(Number(tx.balance_after))}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
