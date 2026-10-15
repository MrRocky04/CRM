import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, RefreshCw, Sparkles, UserPlus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/Button';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Connected" />
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Merqanta Store Synced</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/agent')}
              className="hidden sm:inline-flex border-indigo-200 bg-indigo-50/50 text-brand-indigo hover:bg-indigo-100"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-indigo" />
              <span>Merqanta Agent</span>
            </Button>

            <Button
              variant="indigo"
              size="sm"
              onClick={() => navigate('/customers?action=new')}
              className="hidden sm:inline-flex"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </Button>

            <Link
              to="/settings"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Sync Status"
            >
              <RefreshCw className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
