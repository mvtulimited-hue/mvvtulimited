import { Link } from 'react-router-dom';
import {
  Smartphone, Wifi, Gift, ShieldCheck, Zap, Clock,
  ArrowRight, CheckCircle2, Star, Phone, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                <span className="text-white font-heading font-bold text-lg">M</span>
              </div>
              <div>
                <span className="font-heading font-bold text-lg text-slate-900">M VTU</span>
                <span className="text-xs text-slate-500 ml-1 block leading-none -mt-0.5">LTD</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Services</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">How It Works</a>
              <a href="#why-us" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Why Us</a>
              <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">FAQ</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/signin" className="text-sm font-semibold text-slate-700 hover:text-primary-600 transition-colors px-4 py-2">
                Sign In
              </Link>
              <Link to="/signup" className="text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md">
                Get Started
              </Link>
            </div>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white animate-slide-in-right">
            <div className="px-4 py-4 space-y-3">
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-600 py-2">Services</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-600 py-2">How It Works</a>
              <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-600 py-2">Why Us</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-600 py-2">FAQ</a>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link to="/signin" className="text-sm font-semibold text-slate-700 py-2">Sign In</Link>
                <Link to="/signup" className="text-sm font-semibold text-white bg-primary-600 px-5 py-2.5 rounded-xl text-center">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50/50">
        <div className="absolute inset-0 bg-grid-slate-100 [background-size:40px_40px] opacity-30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-200/20 rounded-full blur-3xl translate-y-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-6">
                <Zap className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-primary-700">Instant Top-Ups, 24/7</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] text-balance">
                Airtime, Data & Gift Cards — <span className="text-primary-600">in seconds</span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
                M VTU LTD is Nigeria's trusted platform for instant airtime, data bundles, and gift card trading. Fund your wallet with Paystack and top up anytime, anywhere.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/20 transition-all hover:shadow-xl hover:shadow-primary-600/30 group">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#services" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-slate-200 hover:border-primary-300 text-slate-700 font-semibold transition-all">
                  Explore Services
                </a>
              </div>

              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-accent-400 text-accent-400" />)}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">Trusted by 10,000+ Nigerians</p>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/60">
                <img
                  src="https://images.pexels.com/photos/7620910/pexels-photo-7620910.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Person using phone for mobile payment"
                  className="w-full h-[500px] object-cover"
                />
              </div>

              {/* Floating cards */}
              <div className="absolute -bottom-6 -left-6 z-20 bg-white rounded-2xl shadow-xl p-4 border border-slate-100 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Top-up Successful</p>
                    <p className="text-xs text-slate-500">₦500 airtime to MTN</p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 z-20 bg-white rounded-2xl shadow-xl p-4 border border-slate-100 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Instant Delivery</p>
                    <p className="text-xs text-slate-500">Under 5 seconds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">Everything you need, in one app</h2>
            <p className="mt-4 text-lg text-slate-600">Buy airtime, purchase data bundles, and trade gift cards — all from your wallet.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative p-8 rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-xl transition-all bg-white">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 group-hover:bg-primary-600 flex items-center justify-center transition-colors">
                <Smartphone className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-bold text-slate-900">Airtime Top-Up</h3>
              <p className="mt-3 text-slate-600">Recharge any Nigerian network instantly — MTN, Airtel, Glo, 9mobile, and more.</p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-success-500" /> All major networks</li>
                <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-success-500" /> Instant delivery</li>
                <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-success-500" /> No service fees</li>
              </ul>
            </div>

            <div className="group relative p-8 rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-xl transition-all bg-white">
              <div className="w-14 h-14 rounded-2xl bg-accent-100 group-hover:bg-accent-600 flex items-center justify-center transition-colors">
                <Wifi className="w-7 h-7 text-accent-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-bold text-slate-900">Data Bundles</h3>
              <p className="mt-3 text-slate-600">Buy affordable data plans for any network. Daily, weekly, and monthly options.</p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-success-500" /> Flexible plans</li>
                <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-success-500" /> Best rates</li>
                <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-success-500" /> Instant activation</li>
              </ul>
            </div>

            <div className="group relative p-8 rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-xl transition-all bg-white">
              <div className="w-14 h-14 rounded-2xl bg-success-100 group-hover:bg-success-600 flex items-center justify-center transition-colors">
                <Gift className="w-7 h-7 text-success-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-bold text-slate-900">Gift Cards</h3>
              <p className="mt-3 text-slate-600">Buy and send gift cards from top brands — Amazon, Google Play, iTunes, Steam, and more.</p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-success-500" /> 50+ brands</li>
                <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-success-500" /> Email delivery</li>
                <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-success-500" /> Global brands</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">How it works</h2>
            <p className="mt-4 text-lg text-slate-600">Three simple steps to get started.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Create an account', desc: 'Sign up with your email and phone number. It takes less than a minute.', icon: Smartphone },
              { step: 2, title: 'Fund your wallet', desc: 'Add money to your wallet using Paystack. Secure and instant.', icon: ShieldCheck },
              { step: 3, title: 'Buy & enjoy', desc: 'Purchase airtime, data, or gift cards. Delivered instantly to your recipient.', icon: Zap },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center font-heading font-bold text-lg">
                      {step}
                    </div>
                    <Icon className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-slate-600">{desc}</p>
                </div>
                {step < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-10 w-8 h-8 items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section id="why-us" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">Why choose M VTU LTD?</h2>
              <p className="mt-4 text-lg text-slate-600">We're built for speed, security, and reliability — the way Nigerians need it.</p>

              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-slate-900">Lightning-fast delivery</h3>
                    <p className="mt-1 text-slate-600">Every transaction is processed instantly. No waiting, no delays.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-slate-900">Bank-grade security</h3>
                    <p className="mt-1 text-slate-600">Your wallet is protected with encrypted transactions and Paystack's secure payment infrastructure.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-slate-900">24/7 availability</h3>
                    <p className="mt-1 text-slate-600">Top up at any time, day or night. Our platform never sleeps.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-slate-900">Dedicated support</h3>
                    <p className="mt-1 text-slate-600">Need help? Our support team is always ready to assist you.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10">
                <img
                  src="https://images.pexels.com/photos/7534379/pexels-photo-7534379.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Making mobile payment"
                  className="w-full h-[450px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">Frequently asked questions</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How do I fund my wallet?', a: 'Sign in, go to your wallet, and click "Fund Wallet". You\'ll be redirected to Paystack to complete your payment securely. Your wallet is credited instantly after payment.' },
              { q: 'Which networks are supported?', a: 'We support MTN, Airtel, Glo, 9mobile, Spectranet, and Smile for both airtime and data bundles.' },
              { q: 'Are there any service fees?', a: 'No. We do not charge any service fees on airtime and data purchases. You pay exactly the face value.' },
              { q: 'How long does delivery take?', a: 'All transactions are processed instantly. Airtime and data are typically delivered within 5 seconds.' },
              { q: 'What if my purchase fails?', a: 'If a transaction fails, your wallet is automatically refunded. You can also check your transaction history for status updates.' },
              { q: 'Is my payment information secure?', a: 'Yes. All payments are processed through Paystack, a PCI-DSS compliant payment processor. We never store your card details.' },
            ].map((item, i) => (
              <details key={i} className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-semibold text-slate-900">{item.q}</span>
                  <span className="ml-4 text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-5 pb-5 text-slate-600">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-700 to-primary-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-4 text-lg text-primary-100">Join thousands of Nigerians who top up smarter with M VTU LTD.</p>
          <Link to="/signup" className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-700 font-semibold text-lg hover:bg-primary-50 transition-all shadow-lg group">
            Create Free Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <span className="text-white font-heading font-bold text-lg">M</span>
                </div>
                <div>
                  <span className="font-heading font-bold text-lg text-white">M VTU</span>
                  <span className="text-xs text-slate-500 ml-1 block leading-none -mt-0.5">LTD</span>
                </div>
              </div>
              <p className="text-sm max-w-md">Nigeria's trusted platform for instant airtime, data bundles, and gift card trading. Powered by Paystack and Reloadly.</p>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li>Airtime Top-Up</li>
                <li>Data Bundles</li>
                <li>Gift Cards</li>
                <li>Wallet Funding</li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} M VTU LTD. All rights reserved. Registered in Nigeria.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
