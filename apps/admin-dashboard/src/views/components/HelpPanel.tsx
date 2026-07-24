import { useState } from 'react';

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

const HELP_SECTIONS = [
  {
    id: 'catalog',
    title: '📦 Catalog Management',
    content: `
**Creating a prototype:**
1. Go to Catalog → Click "Add Prototype"
2. Fill in name, description, category, price, and stock
3. Save → The product appears on the landing page instantly (via SSE)

**Editing:** Click "Edit" on any row to modify fields.

**Deactivating:** Removes the product from the public catalog without deleting it. You can reactivate later.

**Images:** After creating a prototype, click "Edit" and use the image upload section. Supported: JPEG, PNG, WebP (max 5MB).
    `,
  },
  {
    id: 'orders',
    title: '🛒 Orders (Flow A)',
    content: `
**Flow:** Customer pays → Order created → You review → Accept or Reject

**Accept:** Sets estimated delivery date, deducts stock, sends confirmation email.

**Reject:** Triggers automatic refund via PayPal, notifies customer.

**Important:** Stock is only deducted when you ACCEPT. If you reject, no stock changes.
    `,
  },
  {
    id: 'quotes',
    title: '📋 Quotes (Flow B)',
    content: `
**Flow:** Customer requests → You price it → Customer accepts/rejects → Payment

**Quoting:** Click "Present Quote" to set price and lead time. Customer receives email with accept/reject buttons.

**Deadlines:**
- Customer has 48h to respond to your quote
- If accepted, 24h to pay
- Expired quotes are marked automatically (check daily)

**Archiving:** Rejected/expired quotes can be archived to keep the list clean.
    `,
  },
  {
    id: 'supplies',
    title: '🏗️ Supplies & Stock',
    content: `
**Low stock alerts:** The system checks every hour. If a supply drops below its minimum, you get a notification (bell icon + sound).

**Excel import:** Upload a spreadsheet to bulk-update supply quantities.

**Stock ≠ Supplies:** Stock is finished products (prototypes). Supplies are raw materials used to make them.
    `,
  },
  {
    id: 'complaints',
    title: '📨 Complaints & Refunds',
    content: `
**Flow:** Customer submits → You review → Approve refund OR resolve without refund

**Approve refund:** Triggers automatic PayPal refund. Customer is notified.

**Resolve:** Mark as resolved with an explanation. No refund issued.

**Important:** You cannot refund a payment that was already refunded (idempotency protection).
    `,
  },
  {
    id: 'deliveries',
    title: '🚚 Deliveries',
    content: `
**Scheduling:** After accepting an order, the delivery is automatically created based on the estimated date you set.

**Status updates:** Mark deliveries as shipped, in-transit, or delivered. Customers are not directly notified yet (future feature).
    `,
  },
  {
    id: 'notifications',
    title: '🔔 Notifications',
    content: `
**Real-time:** Notifications arrive via WebSocket — you'll hear a sound and see the bell badge update.

**Types:** New orders, new quotes, complaints, low stock alerts, security alerts.

**Mark as read:** Click on a notification to mark it read. The unread count updates across tabs.
    `,
  },
];

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>('catalog');

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-elevated animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Help panel"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Help & Documentation</h2>
            <p className="text-xs text-gray-500">How to use the admin panel</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close help panel"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-2">
            {HELP_SECTIONS.map((section) => (
              <div key={section.id} className="rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50"
                  aria-expanded={expandedId === section.id}
                >
                  <span className="text-sm font-semibold text-gray-800">{section.title}</span>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${expandedId === section.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedId === section.id && (
                  <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-3">
                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line text-xs leading-relaxed">
                      {section.content.trim()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick tips */}
          <div className="mt-8 rounded-xl bg-brand-50 p-4">
            <h3 className="text-sm font-semibold text-brand-800">💡 Quick Tips</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-brand-700">
              <li>• Changes to catalog are reflected on the landing page in real-time</li>
              <li>• All monetary operations use PayPal — refunds are automatic</li>
              <li>• Notifications play a sound — check your browser permissions</li>
              <li>• Rate limiting protects login — 5 attempts per 15 minutes</li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
