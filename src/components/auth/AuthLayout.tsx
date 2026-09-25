import { Link } from 'react-router-dom';
import { Smartphone, Wifi, Gift, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [background-size:40px_40px] opacity-20" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-400/20 rounded-full blur-3xl translate-y-1/4" />

        <div className="relative flex flex-col justify-between p-12 text-white w-full">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <span className="font-heading font-bold text-lg">M</span>
            </div>
            <div>
              <span className="font-heading font-bold text-lg">M VTU</span>
              <span className="text-xs text-primary-200 ml-1 block leading-none -mt-0.5">LTD</span>
            </div>
          </Link>

          <div className="max-w-md">
            <h2 className="font-heading text-3xl font-bold leading-tight">
              Top up smarter with Nigeria's most trusted VTU platform
            </h2>
            <p className="mt-4 text-primary-100">Instant airtime, data, and gift cards — all in one wallet.</p>

            <div className="mt-10 space-y-4">
              {[
                { icon: Smartphone, text: 'Airtime for all Nigerian networks' },
                { icon: Wifi, text: 'Affordable data bundles, daily to monthly' },
                { icon: Gift, text: 'Gift cards from 50+ global brands' },
                { icon: Zap, text: 'Instant delivery, 24/7 availability' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-primary-50">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-primary-200">
            <ShieldCheck className="w-4 h-4" />
            Secured by Paystack
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden p-6">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <span className="text-white font-heading font-bold text-lg">M</span>
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-slate-900">M VTU</span>
              <span className="text-xs text-slate-500 ml-1 block leading-none -mt-0.5">LTD</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mt-2 text-slate-600">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
