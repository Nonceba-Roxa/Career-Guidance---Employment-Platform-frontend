import React, { useEffect } from 'react';
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
import { CircularProgress, Container, Box, Typography, Button, Alert } from '@mui/material';
import './App.css';

// Layout Component
const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <NavigationBar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

// Protected Route Component with Email Verification Check
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/select-role" replace />;
  }

  if (!profile) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        flexDirection: 'column',
        gap: 3
      }}>
        <Typography variant="h4" gutterBottom>
          Profile Loading...
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please wait while we load your profile information.
        </Typography>
        <CircularProgress />
      </Container>
    );
  }

  // Check email verification for non-admin users
  if (!user.emailVerified && profile.role !== 'admin') {
    const userRole = profile.role?.toLowerCase();
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        flexDirection: 'column',
        gap: 3,
        p: 4
      }}>
        <Alert severity="warning" sx={{ width: '100%', maxWidth: 500 }}>
          Email verification required
        </Alert>
        <Typography variant="h4" gutterBottom textAlign="center">
          Email Verification Required
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 500 }}>
          Please verify your email address before accessing the dashboard. 
          We've sent a verification link to <strong>{user.email}</strong>.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ 
              backgroundColor: '#6d4c41',
              '&:hover': { backgroundColor: '#5d4037' }
            }}
          >
            Check Verification Status
          </Button>
          <Button 
            variant="outlined"
            onClick={() => window.location.href = `/login/${userRole}`}
          >
            Back to Login
          </Button>
        </Box>
      </Container>
    );
  }

  // Check if user role is allowed for this route
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        flexDirection: 'column',
        gap: 3,
        textAlign: 'center'
      }}>
        <Typography variant="h4" gutterBottom color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          You don't have permission to access this page. Your role is: <strong>{profile.role}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Required roles: {allowedRoles.join(', ')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => window.history.back()}
            sx={{ 
              backgroundColor: '#6d4c41',
              '&:hover': { backgroundColor: '#5d4037' }
            }}
          >
            Go Back
          </Button>
          <Button 
            variant="outlined"
            onClick={() => window.location.href = '/select-role'}
          >
            Home
          </Button>
        </Box>
      </Container>
    );
  }

  return children;
};

// Role-based Route Components with proper route handling
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

// Public route component (for login/register when already authenticated)
const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh'
      }}>
        <CircularProgress />
      </Container>
    );
  }

  // If user is already authenticated and verified, redirect to appropriate dashboard
  if (user && profile) {
    // Check if user needs email verification
    if (!user.emailVerified && profile.role !== 'admin') {
      // Allow them to stay on public routes if not verified
      return children;
    }
    
    // If verified, redirect to dashboard
    const userRole = profile.role?.toLowerCase();
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'institute':
        return <Navigate to="/institute" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      case 'company':
        return <Navigate to="/company" replace />;
      default:
        return children;
    }
  }

  return children;
};

function App() {
  // ===== Backend Health Check =====
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        // Only check if API URL is defined
        if (process.env.REACT_APP_API_URL) {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/health`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          console.log('✅ Backend Health:', data);
        }
      } catch (error) {
        console.error('❌ Failed to fetch backend health:', error);
      }
    };

    checkBackendHealth();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/select-role" replace />} />
            <Route 
              path="/select-role" 
              element={
                <PublicRoute>
                  <RoleSelection />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register/:role" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login/:role" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />

            {/* Protected Dashboard Routes */}
            <Route path="/admin/*" element={<AdminRoute />} />
            <Route path="/institute/*" element={<InstituteRoute />} />
            <Route path="/student/*" element={<StudentRoute />} />
            <Route path="/company/*" element={<CompanyRoute />} />

            {/* Redirect all dashboard root paths to their main page */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/institute" element={<Navigate to="/institute/dashboard" replace />} />
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/select-role" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;