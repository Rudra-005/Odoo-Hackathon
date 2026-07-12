import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon, className }) => {
  return (
    <Card className={cn('hover:shadow-md hover:-translate-y-0.5 transition-all duration-300', className)}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4>
          {trend !== undefined && (
            <p className={cn('text-sm font-medium mt-1', trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {trend > 0 ? '+' : ''}{trend}%
              <span className="text-slate-500 dark:text-slate-400 ml-1 font-normal">from last month</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
