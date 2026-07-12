import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Lazy loading pages for code splitting
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Vehicles = React.lazy(() => import('../pages/Vehicles'));
const Drivers = React.lazy(() => import('../pages/Drivers'));
const Trips = React.lazy(() => import('../pages/Trips'));
const Maintenance = React.lazy(() => import('../pages/Maintenance'));
const FuelManagement = React.lazy(() => import('../pages/Fuel'));
const Expenses = React.lazy(() => import('../pages/Expenses'));
const Reports = React.lazy(() => import('../pages/Reports'));
const Settings = React.lazy(() => import('../pages/Settings'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    errorElement: <div>Error occurred.</div>,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <Dashboard />
          </React.Suspense>
        ),
      },
      {
        path: 'vehicles',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <Vehicles />
          </React.Suspense>
        ),
      },
      {
        path: 'drivers',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <Drivers />
          </React.Suspense>
        ),
      },
      {
        path: 'trips',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <Trips />
          </React.Suspense>
        ),
      },
      {
        path: 'maintenance',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <Maintenance />
          </React.Suspense>
        ),
      },
      {
        path: 'fuel',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <FuelManagement />
          </React.Suspense>
        ),
      },
      {
        path: 'expenses',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <Expenses />
          </React.Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <Reports />
          </React.Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <Settings />
          </React.Suspense>
        ),
      },
    ],
  },
  {
    path: '/admin/*',
    element: null,
    loader: () => {
      window.location.href = 'http://localhost:8000/admin/';
      return null;
    }
  },
  {
    path: '*',
    element: <div>404 - Not Found</div>,
  },
]);

