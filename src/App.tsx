import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { isFirebaseConfigured } from './config/firebase';
import { PageLoader } from './components/common/LoadingSpinner';

// Layouts
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Setup Screen
import { SetupScreen } from './pages/SetupScreen';

// Core Dashboard Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ImportData } from './pages/admin/ImportData';

// Placeholder Pages (To be implemented)
import {
  DriverDashboard,
  DispatcherDashboard,
  FleetDashboard,
  VehicleList,
  VehicleDetail,
  VehicleNew,
  DriverList,
  DriverDetail,
  DriverNew,
  TripList,
  TripDetail,
  TripNew,
  Maintenance,
  Fuel,
  Expenses,
  UserManagement,
  ActivityLogs,
} from './pages/placeholders';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return <PageLoader />;

  if (!currentUser || !userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/login" replace />; // or an unauthorized page
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const [configValid, setConfigValid] = useState(true);

  useEffect(() => {
    setConfigValid(isFirebaseConfigured());
  }, []);

  if (!configValid) {
    return <SetupScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect (could be smarter based on role) */}
          <Route index element={<Navigate to="/driver/dashboard" replace />} />

          {/* Admin Routes */}
          <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/import" element={<ProtectedRoute allowedRoles={['ADMIN']}><ImportData /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
          <Route path="admin/activity" element={<ProtectedRoute allowedRoles={['ADMIN']}><ActivityLogs /></ProtectedRoute>} />

          {/* Role Dashboards */}
          <Route path="driver/dashboard" element={<ProtectedRoute allowedRoles={['DRIVER', 'ADMIN']}><DriverDashboard /></ProtectedRoute>} />
          <Route path="dispatcher/dashboard" element={<ProtectedRoute allowedRoles={['DISPATCHER', 'ADMIN']}><DispatcherDashboard /></ProtectedRoute>} />
          <Route path="fleet/dashboard" element={<ProtectedRoute allowedRoles={['FLEET_MANAGER', 'ADMIN']}><FleetDashboard /></ProtectedRoute>} />

          {/* Vehicles */}
          <Route path="vehicles" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER', 'DISPATCHER']}><VehicleList /></ProtectedRoute>} />
          <Route path="vehicles/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER']}><VehicleNew /></ProtectedRoute>} />
          <Route path="vehicles/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER', 'DISPATCHER']}><VehicleDetail /></ProtectedRoute>} />

          {/* Drivers */}
          <Route path="drivers" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER', 'DISPATCHER']}><DriverList /></ProtectedRoute>} />
          <Route path="drivers/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER']}><DriverNew /></ProtectedRoute>} />
          <Route path="drivers/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER', 'DISPATCHER']}><DriverDetail /></ProtectedRoute>} />

          {/* Trips */}
          <Route path="trips" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER', 'DISPATCHER']}><TripList /></ProtectedRoute>} />
          <Route path="trips/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}><TripNew /></ProtectedRoute>} />
          <Route path="trips/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'DRIVER']}><TripDetail /></ProtectedRoute>} />
          <Route path="driver/trips" element={<ProtectedRoute allowedRoles={['DRIVER']}><TripList /></ProtectedRoute>} />

          {/* Ops */}
          <Route path="maintenance" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER']}><Maintenance /></ProtectedRoute>} />
          <Route path="fuel" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER']}><Fuel /></ProtectedRoute>} />
          <Route path="expenses" element={<ProtectedRoute allowedRoles={['ADMIN', 'FLEET_MANAGER']}><Expenses /></ProtectedRoute>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
