import { useState, useEffect } from 'react';
import {
  Receipt, Smartphone, Wifi, Gift, CheckCircle2, XCircle,
  Clock, ArrowDownCircle, ArrowUpCircle, Search, Filter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate } from '@/lib/constants';
import type { Order, WalletTransaction } from '@/types';

type Tab = 'orders' | 'wallet';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: ord } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders((ord as Order[]) || []);

      const { data: tx } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTransactions((tx as WalletTransaction[]) || []);
    })();
  }, [user]);

  const filteredOrders = orders.filter((o) => {
    if (filter !== 'all' && o.service_type !== filter) return false;
    if (search && !o.recipient.toLowerCase().includes(search.toLowerCase()) && !o.product_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredTx = transactions.filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.reference.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const orderFilters = [
    { value: 'all', label: 'All' },
    { value: 'airtime', label: 'Airtime' },
    { value: 'data', label: 'Data' },
    { value: 'giftcard', label: 'Gift Cards' },
  ];

  const txFilters = [
    { value: 'all', label: 'All' },
    { value: 'funding', label: 'Funding' },
    { value: 'purchase', label: 'Purchases' },
    { value: 'refund', label: 'Refunds' },
  ];

  const statusConfig = {
    success: { icon: CheckCircle2, color: 'text-success-600', bg: 'bg-success-100' },
    failed: { icon: XCircle, color: 'text-error-600', bg: 'bg-error-100' },
    pending: { icon: Clock, color: 'text-warning-600', bg: 'bg-warning-100' },
    refunded: { icon: ArrowDownCircle, color: 'text-slate-600', bg: 'bg-slate-100' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="text-slate-600 mt-1">View your purchase and wallet history.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => { setTab('orders'); setFilter('all'); }}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => { setTab('wallet'); setFilter('all'); }}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'wallet' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Wallet Activity
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'orders' ? 'Search by recipient or product...' : 'Search by description or reference...'}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm text-slate-900 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-1">
            {(tab === 'orders' ? orderFilters : txFilters).map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">No orders found</p>
              <p className="text-xs mt-1">Start buying airtime, data, or gift cards to see your history here.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Service</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Recipient</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Amount</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOrders.map((order) => {
                      const sc = statusConfig[order.status];
                      const StatusIcon = sc.icon;
                      return (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                order.service_type === 'airtime' ? 'bg-primary-50' :
                                order.service_type === 'data' ? 'bg-accent-50' : 'bg-success-50'
                              }`}>
                                {order.service_type === 'airtime' && <Smartphone className="w-4 h-4 text-primary-600" />}
                                {order.service_type === 'data' && <Wifi className="w-4 h-4 text-accent-600" />}
                                {order.service_type === 'giftcard' && <Gift className="w-4 h-4 text-success-600" />}
                              </div>
                              <span className="text-sm font-medium text-slate-900 capitalize">{order.service_type}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">{order.recipient}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatNaira(Number(order.amount))}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color} capitalize`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {order.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">{formatDate(order.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-slate-50">
                {filteredOrders.map((order) => {
                  const sc = statusConfig[order.status];
                  const StatusIcon = sc.icon;
                  return (
                    <div key={order.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            order.service_type === 'airtime' ? 'bg-primary-50' :
                            order.service_type === 'data' ? 'bg-accent-50' : 'bg-success-50'
                          }`}>
                            {order.service_type === 'airtime' && <Smartphone className="w-4 h-4 text-primary-600" />}
                            {order.service_type === 'data' && <Wifi className="w-4 h-4 text-accent-600" />}
                            {order.service_type === 'giftcard' && <Gift className="w-4 h-4 text-success-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 capitalize">{order.service_type}</p>
                            <p className="text-xs text-slate-500">{order.recipient}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.color} capitalize`}>
                          <StatusIcon className="w-3 h-3" />
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">{formatDate(order.created_at)}</span>
                        <span className="text-sm font-semibold text-slate-900">{formatNaira(Number(order.amount))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Wallet tab */}
      {tab === 'wallet' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {filteredTx.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">No wallet transactions found</p>
              <p className="text-xs mt-1">Fund your wallet or make a purchase to see activity here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredTx.map((tx) => {
                const isCredit = Number(tx.amount) > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCredit ? 'bg-success-50' : 'bg-error-50'
                      }`}>
                        {isCredit ? <ArrowDownCircle className="w-5 h-5 text-success-600" /> : <ArrowUpCircle className="w-5 h-5 text-error-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 capitalize">{tx.type}</p>
                        <p className="text-xs text-slate-500">{tx.description || formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isCredit ? 'text-success-600' : 'text-slate-900'}`}>
                        {isCredit ? '+' : ''}{formatNaira(Number(tx.amount))}
                      </p>
                      <p className="text-xs text-slate-400">Bal: {formatNaira(Number(tx.balance_after))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
