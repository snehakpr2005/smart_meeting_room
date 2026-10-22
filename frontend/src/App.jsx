import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Rooms from './pages/Rooms';
import BookRoom from './pages/BookRoom';
import MyBookings from './pages/MyBookings';
import Resources from './pages/Resources';
import WaitingList from './pages/WaitingList';
import AdminDashboard from './pages/AdminDashboard';
import FacilityDashboard from './pages/FacilityDashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner text="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to user's permitted home
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'facility_manager') return <Navigate to="/facility" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Role-aware root redirect
const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner text="Loading Smart Meeting Room System..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'facility_manager') return <Navigate to="/facility" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside App Shell Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="book" element={<BookRoom />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="resources" element={<Resources />} />
        <Route path="waiting-list" element={<WaitingList />} />

        {/* Role-Specific Protected Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="facility"
          element={
            <ProtectedRoute allowedRoles={['facility_manager', 'admin']}>
              <FacilityDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
