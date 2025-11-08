// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Link
} from '@mui/material';
import { 
  School, 
  Business, 
  AccountBalance, 
  AdminPanelSettings,
  Email,
  Lock,
  Login as LoginIcon
} from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const { role } = useParams();

  // Role configuration for display
  const roleConfig = {
    student: { 
      title: 'Student Login', 
      icon: <School sx={{ fontSize: 40 }} />, 
      color: '#1976d2',
      description: 'Access your courses, applications, and career opportunities'
    },
    institute: { 
      title: 'Institute Login', 
      icon: <AccountBalance sx={{ fontSize: 40 }} />, 
      color: '#2e7d32',
      description: 'Manage courses, admissions, and student applications'
    },
    company: { 
      title: 'Company Login', 
      icon: <Business sx={{ fontSize: 40 }} />, 
      color: '#ed6c02',
      description: 'Post jobs and find qualified candidates'
    },
    admin: { 
      title: 'Admin Login', 
      icon: <AdminPanelSettings sx={{ fontSize: 40 }} />, 
      color: '#d32f2f',
      description: 'Platform administration and user management'
    }
  };

  // Get current role config or default
  const currentRole = roleConfig[role] || { 
    title: 'Login', 
    icon: <LoginIcon sx={{ fontSize: 40 }} />, 
    color: '#666',
    description: 'Sign in to your account'
  };

  // Redirect if already logged in with correct role
  useEffect(() => {
    if (user && profile && !authLoading) {
      let userRole = profile.role?.toLowerCase();
      if (userRole === 'institution') userRole = 'institute';

      if (role && role !== userRole) {
        setError(`You are logged in as ${userRole}, but trying to access ${role} login. Please logout first.`);
        return;
      }

      redirectToDashboard(userRole);
    }
  }, [user, profile, authLoading, navigate, role]);

  const redirectToDashboard = (userRole) => {
    switch (userRole) {
      case 'admin':
        navigate('/admin');
        break;
      case 'student':
        navigate('/student');
        break;
      case 'institute':
        navigate('/institute');
        break;
      case 'company':
        navigate('/company');
        break;
      default:
        setError(`Unknown user role: ${userRole}. Please contact support.`);
    }
  };

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Container sx={{ 
        mt: 4, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh' 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3, color: currentRole.color }} />
          <Typography variant="h6" gutterBottom>
            Checking authentication...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card 
        elevation={4} 
        sx={{ 
          borderRadius: 3,
          overflow: 'visible',
          borderTop: `4px solid ${currentRole.color}`,
        }}
      >
        <Box sx={{ 
          p: 4, 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${currentRole.color}20 0%, ${currentRole.color}10 100%)`
        }}>
          <Box sx={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: `${currentRole.color}20`,
            mb: 2,
          }}>
            {currentRole.icon}
          </Box>
          
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            {currentRole.title}
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            {currentRole.description}
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              disabled={loading}
              InputProps={{
                startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              disabled={loading}
              InputProps={{
                startAdornment: <Lock sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <Button 
              type="submit"
              variant="contained" 
              disabled={loading || !email || !password}
              size="large"
              sx={{ 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                background: currentRole.color,
                '&:hover': {
                  background: currentRole.color,
                  opacity: 0.9,
                },
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Don't have an account?{' '}
              <Link 
                component="button"
                type="button"
                onClick={() => navigate(role ? `/register/${role}` : '/select-role')}
                sx={{ 
                  fontWeight: 'bold',
                  color: currentRole.color,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Create account
              </Link>
            </Typography>
          </Box>

          {role && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                onClick={() => navigate('/select-role')}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                ← Back to Role Selection
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;