import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LogIn, Lock, Mail, Truck } from 'lucide-react';
import api from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function Login() {
  const [identifier, setIdentifier] = useState('singh005rudra@gmail.com');
  const [password, setPassword] = useState('Rudra@2005');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('auth/login/', {
        email: identifier,
        password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      login(data.access, data.refresh, data.user);
      toast.success('Logged in successfully!');
      navigate(from, { replace: true });
    },
    onError: (error: any) => {
      // Prioritize the deepest detail message over generic "Client Error" wrapper
      const message = error.response?.data?.errors?.errors?.detail ||
                     error.response?.data?.errors?.message ||
                     error.response?.data?.message ||
                     'Invalid email or password';
      toast.error(message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Please enter email/username and password');
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-8 pb-6 text-center">
          <div className="mx-auto w-14 h-14 bg-orange-950/50 dark:bg-[#2a1f18] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-900/20">
            <Truck className="w-7 h-7 text-orange-500" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">TransitOps</h2>
          <p className="text-slate-500 dark:text-slate-400">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email or Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type="text"
                placeholder="Enter your email or username"
                className="pl-10"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">Forgot password?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <Input
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full h-11 text-base flex justify-center items-center" 
            isLoading={loginMutation.isPending}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Secure Enterprise Authentication System
          </p>
        </div>

      </div>
    </div>
  );
}
