import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CatalogGrid } from './views/CatalogGrid';
import { QuoteRequestForm } from './views/QuoteRequestForm';
import { ComplaintForm } from './views/ComplaintForm';
import { QuoteActionResult } from './views/QuoteActionResult';
import { LanguageSelector } from './components/LanguageSelector';
import { useCatalog } from './controllers/useCatalog';

function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M30%205v50M5%2030h50%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.03)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('home.title')}
            <br />
            <span className="text-accent-400">{t('home.subtitle')}</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-brand-200">
            {t(
              'home.description',
              'Custom MDF furniture and elegant event arches — designed to fit your space and style. Browse ready-made pieces or request a custom quote.',
            )}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#catalog" className="btn-primary text-base px-8 py-4">
              {t('nav.catalog')}
            </a>
            <Link to="/quote" className="btn-accent text-base px-8 py-4">
              {t('nav.requestQuote')}
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-8 text-sm text-brand-300">
            <div className="flex items-center gap-2">
              <span className="text-accent-400">✓</span>{' '}
              {t('home.featurePayments', 'PayPal Secure Payments')}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-400">✓</span> {t('home.featureCustom', 'Custom Designs')}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-400">✓</span>{' '}
              {t('home.featureDelivery', 'Fast Delivery')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    {
      icon: '🛋️',
      title: t('home.step1Title', 'Browse or Request'),
      desc: t('home.step1Desc', 'Pick a ready-made piece or describe your custom idea'),
    },
    {
      icon: '💳',
      title: t('home.step2Title', 'Pay Securely'),
      desc: t('home.step2Desc', 'Complete payment via PayPal — no account needed'),
    },
    {
      icon: '🚚',
      title: t('home.step3Title', 'Get It Delivered'),
      desc: t('home.step3Desc', 'We build and deliver to your door'),
    },
  ];

  return (
    <section className="bg-surface-50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-display text-3xl font-bold text-gray-900">
          {t('home.howItWorks', 'How it works')}
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-3xl">
                {s.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  const { t } = useTranslation();
  const { items, loading } = useCatalog();
  return (
    <div className="animate-fade-in">
      <HeroSection />
      <HowItWorks />
      <section id="catalog" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 font-display text-3xl font-bold text-gray-900">{t('catalog.title')}</h2>
        <CatalogGrid items={items} loading={loading} onSelectPrototype={() => {}} />
      </section>
    </div>
  );
}

function QuoteRequestPage() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState<string | null>(null);

  if (success) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center animate-slide-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">{t('quote.success.title')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Quote ID: <code className="rounded bg-gray-100 px-2 py-0.5">{success}</code>
        </p>
        <p className="mt-2 text-sm text-gray-500">{t('quote.success.message')}</p>
        <Link to="/" className="btn-primary mt-8">
          {t('quote.success.backToCatalog')}
        </Link>
      </div>
    );
  }

  return <QuoteRequestForm onSuccess={setSuccess} onCancel={() => window.history.back()} />;
}

function ComplaintPage() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState<string | null>(null);

  if (success) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center animate-slide-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">{t('complaint.success.title')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Reference: <code className="rounded bg-gray-100 px-2 py-0.5">{success}</code>
        </p>
        <p className="mt-2 text-sm text-gray-500">{t('complaint.success.message')}</p>
        <Link to="/" className="btn-primary mt-8">
          {t('complaint.success.backToCatalog')}
        </Link>
      </div>
    );
  }

  return <ComplaintForm onSuccess={setSuccess} />;
}

function QuoteActionPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') ?? '';
  const pathParts = window.location.pathname.split('/');
  const quoteId = pathParts[2] ?? '';
  const action = pathParts[3] as 'accept' | 'reject';

  if (!quoteId || !action || !token) {
    return <p className="p-8 text-center text-red-600">Invalid link</p>;
  }

  return <QuoteActionResult quoteId={quoteId} action={action} token={token} />;
}

function Navigation() {
  const { t } = useTranslation();
  return (
    <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            M
          </div>
          <span className="text-xl font-bold text-gray-900">{t('nav.brand')}</span>
        </Link>

        <div className="hidden items-center gap-8 sm:flex">
          <a
            href="/#catalog"
            className="text-sm font-medium text-gray-600 transition hover:text-brand-600"
          >
            {t('nav.catalog')}
          </a>
          <Link
            to="/quote"
            className="text-sm font-medium text-gray-600 transition hover:text-brand-600"
          >
            {t('nav.requestQuote')}
          </Link>
          <Link
            to="/complaints"
            className="text-sm font-medium text-gray-600 transition hover:text-brand-600"
          >
            {t('nav.complaints')}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link to="/quote" className="btn-primary hidden sm:inline-flex">
            {t('nav.requestQuote')}
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-gray-100 bg-brand-950 text-gray-300">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                M
              </div>
              <span className="text-lg font-bold text-white">{t('nav.brand')}</span>
            </div>
            <p className="mt-3 text-sm text-gray-400">{t('home.subtitle')}</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              {t('footer.quickLinks', 'Quick Links')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#catalog" className="hover:text-white transition">
                  {t('nav.catalog')}
                </a>
              </li>
              <li>
                <Link to="/quote" className="hover:text-white transition">
                  {t('nav.requestQuote')}
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="hover:text-white transition">
                  {t('complaint.title')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              {t('footer.payment', 'Payment')}
            </h4>
            <p className="text-sm text-gray-400">
              {t('footer.paymentDesc', 'Secure payments via PayPal. No account required.')}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded bg-white/10 px-3 py-1 text-xs font-medium">PayPal</span>
              <span className="rounded bg-white/10 px-3 py-1 text-xs font-medium">USD</span>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} ModulApp. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quote" element={<QuoteRequestPage />} />
            <Route path="/complaints" element={<ComplaintPage />} />
            <Route path="/quotes/:id/accept" element={<QuoteActionPage />} />
            <Route path="/quotes/:id/reject" element={<QuoteActionPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
