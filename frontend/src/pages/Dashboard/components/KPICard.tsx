import React from 'react';
import { cn } from '../../../utils/cn';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  colorClass?: string;
}

export function KPICard({ title, value, icon: Icon, trend, subtitle, colorClass = "text-blue-500" }: KPICardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 group-hover:scale-105 transition-transform origin-left">{value}</h3>
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                trend.isPositive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-slate-500 ml-2">{subtitle || 'vs last month'}</span>
            </div>
          )}
        </div>
        
        <div className={cn("p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 group-hover:rotate-12 transition-transform duration-300", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
