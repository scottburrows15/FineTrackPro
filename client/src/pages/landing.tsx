import { 
  Trophy, 
  Landmark,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle,
  Star,
  Quote,
  Zap,
  Globe,
  ArrowRight
} from "lucide-react";
import logoUrl from "@assets/foulpay-logo.png";
import heroPhoneUrl from "@assets/hero-phone-mockup.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <img src={logoUrl} alt="FoulPay" className="h-8 w-auto object-contain" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/api/login'}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => window.location.href = '/api/login'}
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#48C0A3' }}
            >
              Launch App
            </button>
          </div>
        </div>
      </header>

      {/* ===== SECTION 1: HERO ===== */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
          {/* Left Column */}
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium" style={{ color: '#48C0A3' }}>Free for all teams</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6" style={{ color: '#374151' }}>
              Foul Play.{' '}
              <span style={{ color: '#48C0A3' }}>Easy Pay.</span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              The simplest way for sports teams and social clubs to track fines and collect dues via GoCardless. No spreadsheets, no chasing cash.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.href = '/api/login'}
                className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                style={{ backgroundColor: '#48C0A3', boxShadow: '0 8px 30px rgba(72,192,163,0.3)' }}
              >
                Launch App
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('features');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-2xl text-base border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                See Features
              </button>
            </div>
          </div>

          {/* Right Column - Phone mockup */}
          <div className="order-1 md:order-2 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 rounded-[32px] blur-3xl opacity-20" style={{ backgroundColor: '#48C0A3' }} />
              <img 
                src={heroPhoneUrl} 
                alt="FoulPay app showing current fines list on a smartphone" 
                className="relative w-full h-auto rounded-[24px] shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: BENTO GRID FEATURES ===== */}
      <section id="features" className="bg-gray-50 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#374151' }}>
              Everything your team needs
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Built specifically for clubs who want to keep it simple.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Box 1 - Large (spans 2 cols) */}
            <div className="md:col-span-2 bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(72,192,163,0.1)' }}>
                <Zap className="w-6 h-6" style={{ color: '#48C0A3' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#374151' }}>One-Tap Tracking</h3>
              <p className="text-gray-500 mb-6">Issue fines to any player in seconds. No forms, no faff.</p>

              {/* Visual: Simple player list */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                {[
                  { name: 'Jake Williams', amount: '£2.00' },
                  { name: 'Ryan Murphy', amount: '£5.00' },
                  { name: 'Tom Baker', amount: '£1.00' },
                ].map((p) => (
                  <div key={p.name} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#48C0A3' }}>
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium" style={{ color: '#374151' }}>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: '#48C0A3' }}>{p.amount}</span>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#48C0A3' }}>
                        <span className="text-base font-bold leading-none">+</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 2 - GoCardless Powered */}
            <div className="md:col-span-2 bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(72,192,163,0.1)' }}>
                <Landmark className="w-6 h-6" style={{ color: '#48C0A3' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#374151' }}>GoCardless Powered</h3>
              <p className="text-gray-500 mb-6">
                Secure, automated bank transfers directly from player accounts. No more chasing cash or awkward conversations.
              </p>
              <div className="space-y-3">
                {[
                  'Direct Debit collection',
                  'Automated payment reminders',
                  'Bank-level security & encryption',
                  'Instant payment confirmation',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#48C0A3' }} />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 3 - Leaderboard */}
            <div className="md:col-span-2 bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-amber-50">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#374151' }}>Leaderboard of Shame</h3>
              <p className="text-gray-500 mb-6">See who the biggest offenders are. Bragging rights (or shame) included.</p>

              {/* Visual: Mini leaderboard */}
              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Dave "Latecomer" Jones', total: '£42.00', medal: '🥇' },
                  { rank: 2, name: 'Chris "Phone Out" Lee', total: '£35.00', medal: '🥈' },
                  { rank: 3, name: 'Sam "Wrong Kit" Patel', total: '£28.00', medal: '🥉' },
                ].map((p) => (
                  <div key={p.rank} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{p.medal}</span>
                      <span className="text-sm font-medium" style={{ color: '#374151' }}>{p.name}</span>
                    </div>
                    <span className="text-sm font-bold text-amber-600">{p.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 4 - Works for Everyone */}
            <div className="md:col-span-2 bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-blue-50">
                <Globe className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#374151' }}>Works for Everyone</h3>
              <p className="text-gray-500 mb-6">
                Not just for sports teams. FoulPay works for any group that needs to manage fines and dues.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Sunday League', 'Rugby Clubs', 'Cricket Teams', 'Book Clubs', 'Office Swear Jars', 'Societies', 'Fantasy Leagues', 'Pub Teams'].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-600 border border-gray-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: PWA INSTALLATION GUIDE ===== */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 mb-5">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600">No App Store needed</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#374151' }}>
              Get FoulPay on your phone
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Install FoulPay directly from your browser in seconds. Works on iPhone, Android, and desktop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="text-center bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(72,192,163,0.1)' }}>
                <Globe className="w-7 h-7" style={{ color: '#48C0A3' }} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#48C0A3' }}>Step 1</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#374151' }}>Open in Browser</h3>
              <p className="text-sm text-gray-500">
                Visit FoulPay in Safari (iPhone) or Chrome (Android) and sign in to your account.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(72,192,163,0.1)' }}>
                <Share className="w-7 h-7" style={{ color: '#48C0A3' }} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#48C0A3' }}>Step 2</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#374151' }}>Tap Share / Menu</h3>
              <p className="text-sm text-gray-500">
                On iPhone, tap the Share button. On Android, tap the three-dot menu in the top right.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(72,192,163,0.1)' }}>
                <PlusSquare className="w-7 h-7" style={{ color: '#48C0A3' }} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#48C0A3' }}>Step 3</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#374151' }}>Add to Home Screen</h3>
              <p className="text-sm text-gray-500">
                Select "Add to Home Screen" and FoulPay will appear as an app icon - ready to go.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-gray-400">
              FoulPay is a Progressive Web App. You can also use it directly in your browser without installing.
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: SOCIAL PROOF / TESTIMONIALS ===== */}
      <section className="bg-gray-50 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#374151' }}>
              Loved by teams everywhere
            </h2>
            <p className="text-gray-500 text-lg">
              Don't take our word for it - here's what captains are saying.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "FoulPay turned our Sunday League fine-collection from a nightmare into a 30-second job. The GoCardless integration is a game-changer.",
                name: "Joe P.",
                role: "Team Captain, Eastbridge FC",
                stars: 5,
              },
              {
                quote: "We used to lose track of who owed what every week. Now it's all automatic. The lads actually pay up because they can't hide from the leaderboard!",
                name: "Sarah T.",
                role: "Treasurer, Northside RFC",
                stars: 5,
              },
              {
                quote: "Dead simple to set up. Had the whole squad on it within 10 minutes. The best bit? I don't have to chase anyone for money anymore.",
                name: "Marcus D.",
                role: "Social Sec, Westgate Cricket Club",
                stars: 5,
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 flex flex-col">
                <Quote className="w-8 h-8 mb-4 opacity-10" style={{ color: '#48C0A3' }} />
                <p className="text-gray-600 leading-relaxed mb-6 flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#374151' }}>{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#374151' }}>
            Ready to sort your fines?
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            Get your team set up in minutes. No card required, no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.href = '/api/login'}
              className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={{ backgroundColor: '#48C0A3', boxShadow: '0 8px 30px rgba(72,192,163,0.3)' }}
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.href = '/api/login'}
              className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-2xl text-base border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <img src={logoUrl} alt="FoulPay" className="h-7 w-auto object-contain" />
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <button onClick={() => { const el = document.getElementById('features'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-gray-900 transition-colors">Features</button>
              <button onClick={() => window.location.href = '/api/login'} className="hover:text-gray-900 transition-colors">Sign In</button>
              <a href="mailto:support@foulpay.com" className="hover:text-gray-900 transition-colors">Contact</a>
            </nav>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Powered by</span>
              <span className="font-semibold text-gray-500">GoCardless</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} FoulPay. Built for UK sports teams and social clubs.
          </div>
        </div>
      </footer>
    </div>
  );
}
