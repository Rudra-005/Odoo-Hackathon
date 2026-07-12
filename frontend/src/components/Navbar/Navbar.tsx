import React, { useEffect, useState } from 'react';
import { Search, Bell, Moon, Sun, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocation } from 'react-router-dom';

export const Navbar = () => {
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const routeNameMap: Record<string, string> = {
    '/': 'Dashboard',
    '/vehicles': 'Vehicles',
    '/drivers': 'Drivers',
    '/trips': 'Trips',
    '/maintenance': 'Maintenance',
    '/fuel': 'Fuel Logs',
    '/expenses': 'Expenses',
    '/reports': 'Reports',
    '/settings': 'Settings',
  };

  const title = routeNameMap[location.pathname] || 'Dashboard';

  return (
    <header className="h-[70px] bg-white dark:bg-dark-surface border-b border-light-border dark:border-dark-border px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div className="flex items-center flex-1 gap-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize shrink-0">
          {title}
        </h2>

        {/* Global Search Mockup */}
        <div className="hidden md:flex relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search vehicles, drivers, trips..." 
            className="w-full bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-white dark:focus:bg-dark-bg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-700 dark:text-slate-200"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">Ctrl</kbd>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-dark-surface"></span>
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

        <button className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 p-1 pr-2 rounded-full transition-colors">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=2563eb&color=fff" alt="User" className="w-8 h-8 rounded-full" />
          <div className="hidden lg:block text-left mr-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-none">Admin User</p>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
};
