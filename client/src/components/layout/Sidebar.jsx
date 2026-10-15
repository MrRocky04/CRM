import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  CheckSquare,
  Mail,
  FileText,
  Workflow,
  TrendingUp,
  Bot,
  Sliders,
  LogOut,
  Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Customers', to: '/customers', icon: Users },
    { name: 'Orders', to: '/orders', icon: ShoppingBag },
    { name: 'Tasks', to: '/tasks', icon: CheckSquare },
    { name: 'Communications', to: '/communications', icon: Mail },
    { name: 'Templates', to: '/templates', icon: FileText },
    { name: 'Workflows', to: '/workflows', icon: Workflow },
    { name: 'Retention Analytics', to: '/retention', icon: TrendingUp },
    { name: 'Merqanta Action Agent', to: '/agent', icon: Bot, badge: 'Smart' },
    { name: 'Integrations & Sync', to: '/settings', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-brand-dark text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-indigo to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-indigo/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-none">Merqanta</h1>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Commerce Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all group cursor-pointer",
                  isActive
                    ? "bg-brand-indigo text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                    {user?.role || 'STAFF'}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
