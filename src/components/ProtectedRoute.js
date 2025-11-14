// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { CircularProgress, Box, Container } from '@mui/material';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
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

  if (!user) {
    return <Navigate to="/select-role" replace />;
  }

  // Check email verification for non-admin users
  if (!user.emailVerified && profile?.role !== 'admin') {
    // Redirect to appropriate login page with role
    const userRole = profile?.role?.toLowerCase();
    return <Navigate to={`/login/${userRole}`} replace />;
  }

  // Check if user role is allowed for this route
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;