import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './components/SideNav';

export function DashboardLayout() {
  const [sideNavOpen, setSideNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <SideNav open={sideNavOpen} onClose={() => setSideNavOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — mobile only */}
        <header className="flex h-16 items-center bg-white px-4 shadow-sm sm:hidden">
          <button
            onClick={() => setSideNavOpen(true)}
            aria-label="Open navigation menu"
            className="rounded p-2 text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 text-lg font-semibold text-gray-800">Modula Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
