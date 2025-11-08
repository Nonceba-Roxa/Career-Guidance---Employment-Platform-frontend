import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RoleSelection from './components/RoleSelection';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import InstituteDashboard from './components/InstituteDashboard';
import StudentDashboard from './components/StudentDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import { AuthProvider, useAuth } from './AuthContext';
import NavigationBar from './components/NavigationBar';
import Footer from './components/Footer';
import './App.css';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <NavigationBar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

// Enhanced Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/select-role" replace />;
  }

  if (!profile) {
    return (
      <div className="dashboard-container">
        <h2>Profile Loading...</h2>
        <p>Please wait while we load your profile information.</p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <div className="dashboard-container">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page. Your role is: {profile.role}</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  return children;
};

// Route components to handle specific roles
const AdminRoute = () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
);

const InstituteRoute = () => (
  <ProtectedRoute allowedRoles={['institute']}>
    <InstituteDashboard />
  </ProtectedRoute>
);

const StudentRoute = () => (
  <ProtectedRoute allowedRoles={['student']}>
    <StudentDashboard />
  </ProtectedRoute>
);

const CompanyRoute = () => (
  <ProtectedRoute allowedRoles={['company']}>
    <CompanyDashboard />
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/select-role" replace />} />
            <Route path="/select-role" element={<RoleSelection />} />
            <Route path="/register/:role" element={<Register />} />
            <Route path="/login/:role" element={<Login />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/institute" element={<InstituteRoute />} />
            <Route path="/student" element={<StudentRoute />} />
            <Route path="/company" element={<CompanyRoute />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/select-role" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;