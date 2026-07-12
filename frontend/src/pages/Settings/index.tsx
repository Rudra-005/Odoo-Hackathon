import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building2, Bell, Shield, User, Globe, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../utils/cn';
import SettingsService from '../../services/settings.service';
import { CompanyProfile } from '../../types/settings';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company');
  const queryClient = useQueryClient();

  const [companyForm, setCompanyForm] = useState<Partial<CompanyProfile>>({
    name: '', gst_number: '', address: '', email: '', phone: ''
  });

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['companySettings'],
    queryFn: SettingsService.getCompanyProfile,
  });

  useEffect(() => {
    if (companyData) {
      setCompanyForm({
        name: companyData.name,
        gst_number: companyData.gst_number,
        address: companyData.address,
        email: companyData.email,
        phone: companyData.phone
      });
    }
  }, [companyData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CompanyProfile>) => SettingsService.updateCompanyProfile(data),
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });

  const handleSave = () => {
    if (activeTab === 'company') {
      updateMutation.mutate(companyForm);
    } else {
      toast.success('Settings saved');
    }
  };

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Access', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            Platform Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure global preferences and system integrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={handleSave} isLoading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                  activeTab === tab.id 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          {activeTab === 'company' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Company Information</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Update your company's core details and branding.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <Input 
                    value={companyForm.name} 
                    onChange={e => setCompanyForm({...companyForm, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Registration Number</label>
                  <Input 
                    value={companyForm.gst_number} 
                    onChange={e => setCompanyForm({...companyForm, gst_number: e.target.value})} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Headquarters Address</label>
                  <Input 
                    value={companyForm.address} 
                    onChange={e => setCompanyForm({...companyForm, address: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <Input 
                    value={companyForm.email} 
                    onChange={e => setCompanyForm({...companyForm, email: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Support Phone</label>
                  <Input 
                    value={companyForm.phone} 
                    onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">System Preferences</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage localization and measurement units.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <option value="utc">UTC (Coordinated Universal Time)</option>
                    <option value="est">EST (Eastern Standard Time)</option>
                    <option value="pst">PST (Pacific Standard Time)</option>
                    <option value="ist" selected>IST (Indian Standard Time)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Format</label>
                  <select className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <option value="ymd">YYYY-MM-DD</option>
                    <option value="dmy" selected>DD/MM/YYYY</option>
                    <option value="mdy">MM/DD/YYYY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Distance Unit</label>
                  <select className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <option value="km" selected>Kilometers (km)</option>
                    <option value="mi">Miles (mi)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select className="flex h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <option value="usd">USD ($)</option>
                    <option value="inr" selected>INR (₹)</option>
                    <option value="eur">EUR (€)</option>
                    <option value="gbp">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Settings</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configure how and when you receive system alerts.</p>
              </div>
              <div className="space-y-4">
                {[
                  { title: 'Trip Dispatch Alerts', desc: 'Get notified when a new trip is dispatched.', defaultChecked: true },
                  { title: 'Maintenance Reminders', desc: 'Alerts for upcoming scheduled maintenance tasks.', defaultChecked: true },
                  { title: 'Safety Score Warnings', desc: 'Notify when a driver safety score drops below 70.', defaultChecked: true },
                  { title: 'Daily Fleet Report', desc: 'Receive a daily summary email of fleet performance.', defaultChecked: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={item.defaultChecked} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Security & Access</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage API keys and security policies.</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Change Password</h4>
                  <div className="flex gap-4">
                    <Button variant="secondary">Update Password</Button>
                    <Button variant="ghost">Enable 2FA</Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">API Keys</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Keys to access the TransitOps REST API.</p>
                  <div className="flex gap-2 items-center">
                    <code className="px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 flex-1 text-sm font-mono text-slate-600 dark:text-slate-400">
                      sk_live_51Mxxxxxxxxxxxxxxxxxxx...
                    </code>
                    <Button variant="secondary">Regenerate</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
