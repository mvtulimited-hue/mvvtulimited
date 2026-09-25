import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Smartphone, Wifi, Gift, Wallet, ArrowRight,
  TrendingUp, Clock, CheckCircle2, XCircle, Receipt,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate } from '@/lib/constants';
import type { Order, WalletTransaction } from '@/types';

export default function DashboardHome() {
  const { profile, user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentTx, setRecentTx] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState({ airtime: 0, data: 0, giftcard: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentOrders((orders as Order[]) || []);

      const { data: tx } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentTx((tx as WalletTransaction[]) || []);

      const { data: allOrders } = await supabase
        .from('orders')
        .select('service_type, amount')
        .eq('user_id', user.id)
        .eq('status', 'success');

      const s = { airtime: 0, data: 0, giftcard: 0 };
      (allOrders || []).forEach((o: { service_type: string; amount: number }) => {
        if (o.service_type === 'airtime') s.airtime += Number(o.amount);
        if (o.service_type === 'data') s.data += Number(o.amount);
        if (o.service_type === 'giftcard') s.giftcard += Number(o.amount);
      });
      setStats(s);
    })();
  }, [user]);

  const services = [
    { to: '/dashboard/airtime', label: 'Buy Airtime', icon: Smartphone, color: 'bg-primary-600', bgColor: 'bg-primary-50', iconColor: 'text-primary-600' },
    { to: '/dashboard/data', label: 'Buy Data', icon: Wifi, color: 'bg-accent-600', bgColor: 'bg-accent-50', iconColor: 'text-accent-600' },
    { to: '/dashboard/giftcards', label: 'Gift Cards', icon: Gift, color: 'bg-success-600', bgColor: 'bg-success-50', iconColor: 'text-success-600' },
    { to: '/dashboard/wallet', label: 'Fund Wallet', icon: Wallet, color: 'bg-slate-700', bgColor: 'bg-slate-100', iconColor: 'text-slate-700' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Quick actions */}
      <div>
        <h2 className="font-heading text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map(({ to, label, icon: Icon, color, bgColor, iconColor }) => (
            <Link
              key={to}
              to={to}
              className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all overflow-hidden"
            >
              <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <p className="font-heading font-semibold text-slate-900">{label}</p>
              <ArrowRight className="absolute top-5 right-5 w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-slate-300" />
          </div>
          <p className="text-2xl font-heading font-bold text-slate-900">{formatNaira(stats.airtime)}</p>
          <p className="text-sm text-slate-500 mt-1">Total Airtime Purchased</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-accent-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-slate-300" />
          </div>
          <p className="text-2xl font-heading font-bold text-slate-900">{formatNaira(stats.data)}</p>
          <p className="text-sm text-slate-500 mt-1">Total Data Purchased</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
              <Gift className="w-5 h-5 text-success-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-slate-300" />
          </div>
          <p className="text-2xl font-heading font-bold text-slate-900">{formatNaira(stats.giftcard)}</p>
          <p className="text-sm text-slate-500 mt-1">Total Gift Cards Bought</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-heading font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Recent Orders
            </h3>
            <Link to="/dashboard/transactions" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No orders yet. Start by buying airtime or data!</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
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
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatNaira(Number(order.amount))}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      {order.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />}
                      {order.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-error-500" />}
                      {order.status === 'pending' && <Clock className="w-3.5 h-3.5 text-warning-500" />}
                      <span className={`text-xs capitalize ${
                        order.status === 'success' ? 'text-success-600' :
                        order.status === 'failed' ? 'text-error-600' : 'text-warning-600'
                      }`}>{order.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-heading font-semibold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-slate-400" />
              Wallet Activity
            </h3>
            <Link to="/dashboard/transactions" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentTx.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No transactions yet. Fund your wallet to get started!</p>
              </div>
            ) : (
              recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-success-50' : 'bg-error-50'
                    }`}>
                      <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {tx.amount > 0 ? '+' : '−'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 capitalize">{tx.type}</p>
                      <p className="text-xs text-slate-500">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-success-600' : 'text-slate-900'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatNaira(Number(tx.amount))}
                    </p>
                    <p className="text-xs text-slate-400">Bal: {formatNaira(Number(tx.balance_after))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Empty state nudge */}
      {profile && Number(profile.wallet_balance) === 0 && recentOrders.length === 0 && (
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white text-center">
          <h3 className="font-heading text-xl font-bold">Get started in 3 easy steps</h3>
          <p className="mt-2 text-primary-100">Fund your wallet, pick a service, and enjoy instant delivery.</p>
          <Link to="/dashboard/wallet" className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-semibold hover:bg-primary-50 transition-colors">
            Fund Your Wallet
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
