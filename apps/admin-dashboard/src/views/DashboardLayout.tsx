import { useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './components/SideNav';
import { HelpPanel } from './components/HelpPanel';
import { NotificationBell } from './components/NotificationBell';
import { NotificationPanel } from './components/NotificationPanel';
import { useNotifications } from '../controllers/useNotifications';
import { useAuth } from '../controllers/useAuth';

/** Notification types that map to sidebar tabs */
const QUOTE_TYPES = ['new_quote_request', 'quote_response'];
const COMPLAINT_TYPES = ['new_complaint'];

export function DashboardLayout() {
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const { accessToken } = useAuth();
  const { notifications, unreadCount, soundEnabled, toggleSound, markRead } =
    useNotifications(accessToken);

  // Compute badge counts for sidebar tabs from unread notifications
  const sidebarBadges = useMemo(() => {
    const unread = notifications.filter((n) => !n.read);
    const quotesCount = unread.filter((n) => QUOTE_TYPES.includes(n.type)).length;
    const complaintsCount = unread.filter((n) => COMPLAINT_TYPES.includes(n.type)).length;

    const badges: Record<string, number> = {};
    if (quotesCount > 0) badges['/quotes'] = quotesCount;
    if (complaintsCount > 0) badges['/complaints'] = complaintsCount;
    return badges;
  }, [notifications]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <SideNav open={sideNavOpen} onClose={() => setSideNavOpen(false)} badges={sidebarBadges} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSideNavOpen(true)}
              aria-label="Abrir menú de navegación"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2 className="text-sm font-semibold text-gray-700 sm:text-base">Panel de Control</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <NotificationBell
                unreadCount={unreadCount}
                onClick={() => setNotifPanelOpen((v) => !v)}
              />
              {notifPanelOpen && (
                <NotificationPanel
                  notifications={notifications}
                  soundEnabled={soundEnabled}
                  onToggleSound={toggleSound}
                  onMarkRead={markRead}
                  onClose={() => setNotifPanelOpen(false)}
                />
              )}
            </div>

            {/* Help button */}
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-brand-600"
              aria-label="Abrir panel de ayuda"
            >
              <span>❓</span>
              <span className="hidden sm:inline">Ayuda</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Help Panel */}
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
