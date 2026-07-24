import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import { CatalogGrid } from './views/CatalogGrid';
import { QuoteRequestForm } from './views/QuoteRequestForm';
import { ComplaintForm } from './views/ComplaintForm';
import { QuoteActionResult } from './views/QuoteActionResult';
import { LanguageSelector } from './components/LanguageSelector';

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M30%205v50M5%2030h50%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.03)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Modular furniture
            <br />
            <span className="text-accent-400">crafted for you</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-brand-200">
            Custom MDF furniture and elegant event arches — designed to fit your space and style.
            Browse ready-made pieces or request a custom quote.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#catalog" className="btn-primary text-base px-8 py-4">
              Browse Catalog
            </a>
            <Link to="/quote" className="btn-accent text-base px-8 py-4">
              Request Custom Quote
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-8 text-sm text-brand-300">
            <div className="flex items-center gap-2">
              <span className="text-accent-400">✓</span> PayPal Secure Payments
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-400">✓</span> Custom Designs
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent-400">✓</span> Fast Delivery
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: '🛋️',
      title: 'Browse or Request',
      desc: 'Pick a ready-made piece or describe your custom idea',
    },
    { icon: '💳', title: 'Pay Securely', desc: 'Complete payment via PayPal — no account needed' },
    { icon: '🚚', title: 'Get It Delivered', desc: 'We build and deliver to your door' },
  ];

  return (
    <section className="bg-surface-50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center font-display text-3xl font-bold text-gray-900">How it works</h2>
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
  return (
    <div className="animate-fade-in">
      <HeroSection />
      <HowItWorks />
      <section id="catalog" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 font-display text-3xl font-bold text-gray-900">Our Catalog</h2>
        <CatalogGrid items={[]} loading={false} onSelectPrototype={() => {}} />
      </section>
    </div>
  );
}

function QuoteRequestPage() {
  const [success, setSuccess] = useState<string | null>(null);

  if (success) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center animate-slide-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Request Submitted</h1>
        <p className="mt-2 text-sm text-gray-600">
          Quote ID: <code className="rounded bg-gray-100 px-2 py-0.5">{success}</code>
        </p>
        <p className="mt-2 text-sm text-gray-500">Check your email for confirmation.</p>
        <Link to="/" className="btn-primary mt-8">
          Back to catalog
        </Link>
      </div>
    );
  }

  return <QuoteRequestForm onSuccess={setSuccess} onCancel={() => window.history.back()} />;
}

function ComplaintPage() {
  const [success, setSuccess] = useState<string | null>(null);

  if (success) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center animate-slide-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Complaint Received</h1>
        <p className="mt-2 text-sm text-gray-600">
          Reference: <code className="rounded bg-gray-100 px-2 py-0.5">{success}</code>
        </p>
        <p className="mt-2 text-sm text-gray-500">Check your email for a receipt.</p>
        <Link to="/" className="btn-primary mt-8">
          Back to catalog
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
  return (
    <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            M
          </div>
          <span className="text-xl font-bold text-gray-900">ModulApp</span>
        </Link>

        <div className="hidden items-center gap-8 sm:flex">
          <a
            href="/#catalog"
            className="text-sm font-medium text-gray-600 transition hover:text-brand-600"
          >
            Catalog
          </a>
          <Link
            to="/quote"
            className="text-sm font-medium text-gray-600 transition hover:text-brand-600"
          >
            Custom Quote
          </Link>
          <Link
            to="/complaints"
            className="text-sm font-medium text-gray-600 transition hover:text-brand-600"
          >
            Support
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link to="/quote" className="btn-primary hidden sm:inline-flex">
            Get a Quote
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-brand-950 text-gray-300">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                M
              </div>
              <span className="text-lg font-bold text-white">ModulApp</span>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Modular furniture & custom event arches. Designed and crafted with care.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#catalog" className="hover:text-white transition">
                  Catalog
                </a>
              </li>
              <li>
                <Link to="/quote" className="hover:text-white transition">
                  Request Quote
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="hover:text-white transition">
                  Complaints & Refunds
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Payment
            </h4>
            <p className="text-sm text-gray-400">
              Secure payments via PayPal. No account required.
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
