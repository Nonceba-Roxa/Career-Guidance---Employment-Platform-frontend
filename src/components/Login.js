// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const { 
    user, 
    profile, 
    loading: authLoading, 
    login, 
    sendVerificationEmail,
    resetPassword,
    clearError,
    logout
  } = useAuth();
  
  const navigate = useNavigate();
  const { role } = useParams();

  // Professional color scheme (no blue)
  const roleConfig = {
    student: { 
      title: 'Student Login', 
      color: '#6d4c41', // Brown
      description: 'Access your courses, applications, and career opportunities',
      dashboard: '/student'
    },
    institute: { 
      title: 'Institute Login', 
      color: '#2e7d32', // Green
      description: 'Manage courses, admissions, and student applications',
      dashboard: '/institute'
    },
    company: { 
      title: 'Company Login', 
      color: '#ed6c02', // Orange
      description: 'Post jobs and find qualified candidates',
      dashboard: '/company'
    },
    admin: { 
      title: 'Admin Login', 
      color: '#d32f2f', // Red
      description: 'Platform administration and user management',
      dashboard: '/admin'
    }
  };

  // Get current role config or default
  const currentRole = roleConfig[role] || { 
    title: 'Login', 
    color: '#5d4037',
    description: 'Sign in to your account',
    dashboard: '/dashboard'
  };

  // Clear errors when component unmounts or inputs change
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  useEffect(() => {
    if (error) {
      setNeedsVerification(error.includes('verify your email'));
    }
  }, [error]);

  // Redirect if already logged in with correct role and verified (or admin)
  useEffect(() => {
    if (user && profile && !authLoading) {
      let userRole = profile.role?.toLowerCase();
      if (userRole === 'institution') userRole = 'institute';

      if (role && role !== userRole) {
        setError(`You are logged in as ${userRole}, but trying to access ${role} login. Please logout first.`);
        return;
      }

      // Check if user needs email verification (non-admin users only)
      if (!user.emailVerified && userRole !== 'admin') {
        setNeedsVerification(true);
        setVerificationDialogOpen(true);
        setError('Please verify your email address to access your account.');
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

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      const userCredential = await login(email, password);
      
      // Check if email is verified for non-admin users
      if (userCredential.user && !userCredential.user.emailVerified && role !== 'admin') {
        setNeedsVerification(true);
        setVerificationDialogOpen(true);
        setError('Please verify your email address to access your account.');
        
        // Log out the unverified user
        await logout();
        return;
      }

      // If verified or admin, proceed to dashboard
      if (profile) {
        redirectToDashboard(profile.role?.toLowerCase());
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        default:
          errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setError('');
      setVerificationDialogOpen(true);
    } catch (err) {
      let errorMessage = 'Failed to send password reset email.';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = err.message || 'Failed to send password reset email.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    setResendLoading(true);
    setError('');

    try {
      // For resending verification, we need to temporarily log the user in
      const userCredential = await login(email, password);
      await sendVerificationEmail();
      setError('');
      setVerificationDialogOpen(true);
      // Log out after sending verification
      await logout();
    } catch (err) {
      setError('Failed to send verification email: ' + err.message);
    } finally {
      setResendLoading(false);
    }
  };

  // Toggle password visibility
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Close verification dialog
  const handleCloseVerificationDialog = () => {
    setVerificationDialogOpen(false);
  };

  if (authLoading) {
    return (
      <Container sx={{ 
        mt: 4, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        backgroundColor: '#fafafa'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3, color: currentRole.color }} />
          <Typography variant="h6" gutterBottom>
            Checking authentication...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify your session.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 4, backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <Card 
          elevation={4} 
          sx={{ 
            borderRadius: 3,
            overflow: 'visible',
            borderTop: `4px solid ${currentRole.color}`,
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: `${currentRole.color}08`,
            borderBottom: `1px solid ${currentRole.color}20`
          }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
              {currentRole.title}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '400px', mx: 'auto' }}>
              {currentRole.description}
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert 
                severity={needsVerification ? "warning" : "error"} 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  alignItems: 'center'
                }}
                action={
                  needsVerification ? (
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      startIcon={resendLoading ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                      {resendLoading ? 'Sending...' : 'Resend'}
                    </Button>
                  ) : error.includes('password') ? (
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={handleForgotPassword}
                      disabled={loading || !email}
                    >
                      Reset Password
                    </Button>
                  ) : null
                }
              >
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: currentRole.color,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: currentRole.color,
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentRole.color,
                  }
                }}
                placeholder="Enter your email address"
              />
              
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <Button
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      sx={{ 
                        color: 'text.secondary',
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        minWidth: 'auto'
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: currentRole.color,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: currentRole.color,
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentRole.color,
                  }
                }}
                placeholder="Enter your password"
              />

              <Box sx={{ textAlign: 'right', mt: -2 }}>
                <Button
                  type="button"
                  onClick={handleForgotPassword}
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    textTransform: 'none',
                    textDecoration: 'none',
                    '&:hover': {
                      color: currentRole.color,
                      backgroundColor: 'transparent',
                      textDecoration: 'underline'
                    }
                  }}
                  disabled={loading}
                >
                  Forgot your password?
                </Button>
              </Box>

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
                  textTransform: 'none',
                  backgroundColor: currentRole.color,
                  '&:hover': {
                    backgroundColor: currentRole.color,
                    opacity: 0.9
                  },
                  '&:disabled': {
                    backgroundColor: '#e0e0e0',
                  }
                }}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Don't have an account?{' '}
                <Button 
                  component={RouterLink}
                  to={role ? `/register/${role}` : '/select-role'}
                  sx={{ 
                    fontWeight: 'bold',
                    color: currentRole.color,
                    textTransform: 'none',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  Create account
                </Button>
              </Typography>
            </Box>

            {role && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  onClick={() => navigate('/select-role')}
                  size="small"
                  sx={{ 
                    color: 'text.secondary',
                    textTransform: 'none',
                    '&:hover': {
                      color: currentRole.color,
                      backgroundColor: `${currentRole.color}10`
                    }
                  }}
                >
                  Back to Role Selection
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Email Verification Required Dialog */}
      <Dialog 
        open={verificationDialogOpen} 
        onClose={handleCloseVerificationDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          pb: 1
        }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            Email Verification Required
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" paragraph align="center" color="text.primary">
            Please verify your email address before logging in.
          </Typography>
          
          <Typography 
            variant="h6" 
            align="center" 
            sx={{ 
              fontWeight: 'bold',
              wordBreak: 'break-all',
              backgroundColor: '#f5f5f5',
              py: 1,
              px: 2,
              borderRadius: 1,
              color: '#2c3e50',
              mb: 2
            }}
          >
            {email}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph align="center">
            We've sent a verification link to your email address. 
            Please check your inbox and click the verification link to activate your account.
            If you don't see the email, check your spam folder.
          </Typography>
          
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'center'
              }
            }}
          >
            You cannot login until your email is verified.
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ 
          justifyContent: 'center', 
          pb: 3,
          pt: 1,
          flexDirection: 'column',
          gap: 1
        }}>
          <Button 
            variant="contained" 
            onClick={handleResendVerification}
            size="large"
            disabled={resendLoading}
            sx={{ 
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontSize: '1rem',
              backgroundColor: currentRole.color
            }}
            startIcon={resendLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleCloseVerificationDialog}
            size="medium"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              borderColor: currentRole.color,
              color: currentRole.color
            }}
          >
            Back to Login
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Login;