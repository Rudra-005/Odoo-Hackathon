import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Truck, Users, Route, Wrench, 
  Droplet, DollarSign, FileBarChart, Settings, 
  LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/cn';

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Vehicles', to: '/vehicles', icon: Truck },
  { name: 'Drivers', to: '/drivers', icon: Users },
  { name: 'Trips', to: '/trips', icon: Route },
  { name: 'Maintenance', to: '/maintenance', icon: Wrench },
  { name: 'Fuel Logs', to: '/fuel', icon: Droplet },
  { name: 'Expenses', to: '/expenses', icon: DollarSign },
  { name: 'Reports', to: '/reports', icon: FileBarChart },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-white dark:bg-dark-surface border-r border-light-border dark:border-dark-border transition-all duration-300 relative',
      collapsed ? 'w-[90px]' : 'w-[280px]'
    )}>
      {/* Brand */}
      <div className="h-[70px] flex items-center px-6 border-b border-light-border dark:border-dark-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold shrink-0">
          T
        </div>
        {!collapsed && (
          <span className="ml-3 text-lg font-bold text-slate-900 dark:text-white truncate">TransitOps</span>
        )}
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-center text-slate-500 hover:text-primary-600 transition-colors shadow-sm"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) => cn(
              'flex items-center px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group',
              isActive 
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
            )}
            title={collapsed ? item.name : undefined}
          >
            <item.icon size={20} className={cn('shrink-0 transition-transform group-hover:scale-110', collapsed && 'mx-auto')} />
            {!collapsed && <span className="ml-3 truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-light-border dark:border-dark-border shrink-0">
        <button className={cn(
          'flex items-center px-3 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200 w-full group',
          collapsed && 'justify-center'
        )}>
          <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
          {!collapsed && <span className="ml-3 truncate">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
