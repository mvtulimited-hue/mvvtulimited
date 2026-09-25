import { useAuth } from '@/context/AuthContext';
import { formatNaira } from '@/lib/constants';
import { Wallet, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WalletBannerProps {
  insufficient?: boolean;
  requiredAmount?: number;
}

export default function WalletBanner({ insufficient, requiredAmount }: WalletBannerProps) {
  const { profile } = useAuth();
  const balance = Number(profile?.wallet_balance || 0);

  return (
    <div className={`rounded-2xl p-5 border ${
      insufficient
        ? 'bg-error-50 border-error-200'
        : 'bg-gradient-to-br from-primary-600 to-primary-800 border-primary-700 text-white'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            insufficient ? 'bg-error-100' : 'bg-white/15'
          }`}>
            <Wallet className={`w-5 h-5 ${insufficient ? 'text-error-600' : 'text-white'}`} />
          </div>
          <div>
            <p className={`text-xs font-medium ${insufficient ? 'text-error-600' : 'text-primary-100'}`}>
              Wallet Balance
            </p>
            <p className={`text-xl font-heading font-bold ${insufficient ? 'text-error-700' : 'text-white'}`}>
              {formatNaira(balance)}
            </p>
          </div>
        </div>
        {insufficient ? (
          <div className="text-right">
            <p className="text-sm text-error-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Insufficient funds
            </p>
            {requiredAmount && (
              <p className="text-xs text-error-500 mt-0.5">Need {formatNaira(requiredAmount)}</p>
            )}
            <Link to="/dashboard/wallet" className="text-xs font-semibold text-error-700 hover:text-error-800 underline mt-1 inline-block">
              Fund wallet
            </Link>
          </div>
        ) : (
          <Link to="/dashboard/wallet" className="text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-lg px-3 py-2 transition-colors">
            Fund Wallet
          </Link>
        )}
      </div>
    </div>
  );
}
