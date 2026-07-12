import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary-500" />
            Platform Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure global preferences and system integrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary">
            Save Changes
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <p className="text-slate-500 dark:text-slate-400">Settings configuration module is currently under development.</p>
      </div>
    </div>
  );
}
