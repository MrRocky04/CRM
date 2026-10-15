import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Orders } from './pages/Orders';
import { Tasks } from './pages/Tasks';
import { Communications } from './pages/Communications';
import { Templates } from './pages/Templates';
import { Workflows } from './pages/Workflows';
import { RetentionAnalytics } from './pages/RetentionAnalytics';
import { ActionAgent } from './pages/ActionAgent';
import { IntegrationSettings } from './pages/IntegrationSettings';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="orders" element={<Orders />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="communications" element={<Communications />} />
            <Route path="templates" element={<Templates />} />
            <Route path="workflows" element={<Workflows />} />
            <Route path="retention" element={<RetentionAnalytics />} />
            <Route path="agent" element={<ActionAgent />} />
            <Route path="settings" element={<IntegrationSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
