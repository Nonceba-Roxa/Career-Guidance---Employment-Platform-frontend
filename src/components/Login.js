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
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  School, 
  Business, 
  AccountBalance, 
  AdminPanelSettings,
  Email,
  Lock,
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Close
} from '@mui/icons-material';

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
    clearError 
  } = useAuth();
  
  const navigate = useNavigate();
  const { role } = useParams();

  // Role configuration for display
  const roleConfig = {
    student: { 
      title: 'Student Login', 
      icon: <School sx={{ fontSize: 40 }} />, 
      color: '#1976d2',
      description: 'Access your courses, applications, and career opportunities',
      dashboard: '/student'
    },
    institute: { 
      title: 'Institute Login', 
      icon: <AccountBalance sx={{ fontSize: 40 }} />, 
      color: '#2e7d32',
      description: 'Manage courses, admissions, and student applications',
      dashboard: '/institute'
    },
    company: { 
      title: 'Company Login', 
      icon: <Business sx={{ fontSize: 40 }} />, 
      color: '#ed6c02',
      description: 'Post jobs and find qualified candidates',
      dashboard: '/company'
    },
    admin: { 
      title: 'Admin Login', 
      icon: <AdminPanelSettings sx={{ fontSize: 40 }} />, 
      color: '#d32f2f',
      description: 'Platform administration and user management',
      dashboard: '/admin'
    }
  };

  // Get current role config or default
  const currentRole = roleConfig[role] || { 
    title: 'Login', 
    icon: <LoginIcon sx={{ fontSize: 40 }} />, 
    color: '#666',
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
      
      // Check if email is verified
      if (userCredential.user && !userCredential.user.emailVerified) {
        setNeedsVerification(true);
        setVerificationDialogOpen(true);
        setError('Please verify your email address to access all features.');
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
      await sendVerificationEmail();
      setError('');
      setVerificationDialogOpen(true);
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
        minHeight: '80vh' 
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
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card 
          elevation={4} 
          sx={{ 
            borderRadius: 3,
            overflow: 'visible',
            borderTop: `4px solid ${currentRole.color}`,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }}
        >
          <Box sx={{ 
            p: 4, 
            textAlign: 'center',
            background: `linear-gradient(135deg, ${currentRole.color}15 0%, ${currentRole.color}08 100%)`,
            borderBottom: `1px solid ${currentRole.color}20`
          }}>
            <Box sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: `${currentRole.color}15`,
              mb: 2,
              border: `2px solid ${currentRole.color}30`
            }}>
              {currentRole.icon}
            </Box>
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
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
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
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
                <Link
                  component="button"
                  type="button"
                  onClick={handleForgotPassword}
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    textDecoration: 'none',
                    '&:hover': {
                      color: currentRole.color,
                      textDecoration: 'underline'
                    }
                  }}
                  disabled={loading}
                >
                  Forgot your password?
                </Link>
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
                  background: `linear-gradient(135deg, ${currentRole.color} 0%, ${currentRole.color}dd 100%)`,
                  boxShadow: `0 4px 15px ${currentRole.color}40`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${currentRole.color}dd 0%, ${currentRole.color} 100%)`,
                    boxShadow: `0 6px 20px ${currentRole.color}60`,
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                    boxShadow: 'none',
                    transform: 'none'
                  },
                  transition: 'all 0.3s ease'
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
                  component={RouterLink}
                  to={role ? `/register/${role}` : '/select-role'}
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
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      color: currentRole.color,
                      backgroundColor: `${currentRole.color}10`
                    }
                  }}
                  startIcon={<Close />}
                >
                  Back to Role Selection
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Verification/Preset Success Dialog */}
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
          <CheckCircle sx={{ fontSize: 60, color: '#4caf50', mb: 1 }} />
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            {needsVerification ? 'Check Your Email' : 'Reset Link Sent'}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" paragraph align="center">
            {needsVerification 
              ? `We've sent a verification link to:`
              : `We've sent a password reset link to:`
            }
          </Typography>
          
          <Typography 
            variant="h6" 
            align="center" 
            color="primary" 
            paragraph
            sx={{ 
              fontWeight: 'bold',
              wordBreak: 'break-all',
              backgroundColor: '#f5f5f5',
              py: 1,
              px: 2,
              borderRadius: 1
            }}
          >
            {email}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" paragraph align="center">
            {needsVerification 
              ? `Please check your inbox and click the verification link to activate your account. If you don't see the email, check your spam folder.`
              : `Please check your inbox and follow the instructions to reset your password. If you don't see the email, check your spam folder.`
            }
          </Typography>
          
          <Alert 
            severity="info" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'center'
              }
            }}
          >
            {needsVerification
              ? 'You need to verify your email before you can access all features.'
              : 'The reset link will expire in 1 hour for security reasons.'
            }
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ 
          justifyContent: 'center', 
          pb: 3,
          pt: 1
        }}>
          <Button 
            variant="contained" 
            onClick={handleCloseVerificationDialog}
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Continue to Login
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Login;