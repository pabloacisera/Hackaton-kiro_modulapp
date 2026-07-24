import { NavLink } from 'react-router-dom';
import { useAuth } from '../../controllers/useAuth';

const NAV_ITEMS = [
  { to: '/catalog', label: 'Catalog', icon: '📦' },
  { to: '/orders', label: 'Orders', icon: '🛒' },
  { to: '/quotes', label: 'Quotes', icon: '📋' },
  { to: '/supplies', label: 'Supplies', icon: '🏗️' },
  { to: '/complaints', label: 'Complaints', icon: '📨' },
  { to: '/deliveries', label: 'Deliveries', icon: '🚚' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
];

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

export function SideNav({ open, onClose }: SideNavProps) {
  const { accessToken } = useAuth();
  // Extract email from JWT payload (base64 decode)
  let adminEmail = 'Admin';
  try {
    if (accessToken) {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      adminEmail = payload.email ?? payload.sub ?? 'Admin';
    }
  } catch {
    /* ignore */
  }

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          sm:relative sm:translate-x-0 sm:flex`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            M
          </div>
          <span className="text-lg font-bold tracking-wide text-white">Modula</span>
          <span className="ml-auto badge bg-brand-600/30 text-brand-300 text-[10px]">Admin</span>
        </div>

        {/* Navigation */}
        <ul className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600/20 text-white shadow-sm border-l-2 border-brand-400'
                      : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
                  }`
                }
              >
                <span className="text-base">{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* User info */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {adminEmail[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-gray-300">{adminEmail}</p>
              <p className="text-[10px] text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
