import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import { CatalogGrid } from './views/CatalogGrid';
import { QuoteRequestForm } from './views/QuoteRequestForm';
import { ComplaintForm } from './views/ComplaintForm';
import { QuoteActionResult } from './views/QuoteActionResult';

function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Modula</h1>
      <p className="mb-8 text-lg text-gray-600">Modular furniture & custom event arches</p>
      <CatalogGrid items={[]} loading={false} onSelectPrototype={() => {}} />
    </div>
  );
}

function QuoteRequestPage() {
  const [success, setSuccess] = useState<string | null>(null);

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="mb-2 text-xl font-bold">Request Submitted</h1>
        <p className="text-sm text-gray-600">Quote ID: {success}</p>
        <p className="mt-2 text-sm text-gray-500">Check your email for confirmation.</p>
        <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline">
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
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="mb-2 text-xl font-bold">Complaint Received</h1>
        <p className="text-sm text-gray-600">Reference: {success}</p>
        <p className="mt-2 text-sm text-gray-500">Check your email for a receipt.</p>
        <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline">
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
    <nav className="border-b bg-white px-6 py-3">
      <div className="mx-auto flex max-w-6xl items-center gap-6">
        <Link to="/" className="text-lg font-bold text-gray-900">
          Modula
        </Link>
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
          Catalog
        </Link>
        <Link to="/quote" className="text-sm text-gray-600 hover:text-gray-900">
          Request Quote
        </Link>
        <Link to="/complaints" className="text-sm text-gray-600 hover:text-gray-900">
          Complaints
        </Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quote" element={<QuoteRequestPage />} />
        <Route path="/complaints" element={<ComplaintPage />} />
        <Route path="/quotes/:id/accept" element={<QuoteActionPage />} />
        <Route path="/quotes/:id/reject" element={<QuoteActionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
