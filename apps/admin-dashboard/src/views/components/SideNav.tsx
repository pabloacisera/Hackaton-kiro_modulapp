import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/catalog', label: 'Catalog' },
  { to: '/orders', label: 'Orders' },
  { to: '/quotes', label: 'Quotes' },
  { to: '/supplies', label: 'Supplies' },
  { to: '/complaints', label: 'Complaints & Refunds' },
  { to: '/deliveries', label: 'Deliveries' },
  { to: '/notifications', label: 'Notifications' },
];

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

export function SideNav({ open, onClose }: SideNavProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-900 text-white transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          sm:relative sm:translate-x-0 sm:block`}
      >
        <div className="flex h-16 items-center px-6 text-lg font-bold tracking-wide">
          Modula Admin
        </div>

        <ul className="mt-2 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
