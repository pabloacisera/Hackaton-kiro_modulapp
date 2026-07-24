import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './components/SideNav';
import { HelpPanel } from './components/HelpPanel';

export function DashboardLayout() {
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <SideNav open={sideNavOpen} onClose={() => setSideNavOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSideNavOpen(true)}
              aria-label="Open navigation menu"
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
            <h2 className="text-sm font-semibold text-gray-700 sm:text-base">Dashboard</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Help button */}
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-brand-600"
              aria-label="Open help panel"
            >
              <span>❓</span>
              <span className="hidden sm:inline">Help</span>
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
