// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Alert, 
  Card, 
  CardContent, 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';

const Register = () => {
  const { role } = useParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Professional color scheme (no blue)
  const roleConfig = {
    student: { 
      title: 'Student Registration', 
      description: 'Join to discover opportunities', 
      color: '#6d4c41' // Brown
    },
    institute: { 
      title: 'Institute Registration', 
      description: 'Manage courses and applications', 
      color: '#2e7d32' // Green
    },
    company: { 
      title: 'Company Registration', 
      description: 'Post jobs and find graduates', 
      color: '#ed6c02' // Orange
    },
  };

  if (role === 'admin') {
    navigate('/login/admin');
    return null;
  }

  const currentRole = roleConfig[role];

  if (!currentRole) {
    navigate('/select-role');
    return null;
  }

  const handleRegister = async () => {
    try {
      setError('');
      setLoading(true);
      
      if (!name || !email || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Prepare user data
      const userData = {
        role: role,
        name: name,
        status: role === 'company' ? 'pending' : 'active',
        emailVerified: false
      };

      // Add role-specific fields
      if (role === 'student') {
        userData.gpa = 0;
        userData.field = '';
        userData.experience = 0;
        userData.skills = [];
        userData.bio = '';
        userData.phone = '';
        userData.linkedin = '';
      } else if (role === 'institute') {
        userData.location = '';
        userData.contactEmail = email;
        userData.phone = '';
        userData.website = '';
        userData.description = '';
        userData.establishedYear = '';
      } else if (role === 'company') {
        userData.industry = '';
        userData.size = '';
        userData.location = '';
        userData.contactEmail = email;
        userData.phone = '';
        userData.website = '';
        userData.linkedin = '';
        userData.description = '';
      }

      // Use AuthContext signup function
      await signup(email, password, userData);
      
      setVerificationSent(true);
      setShowVerificationDialog(true);
    } catch (err) {
      console.error('Registration error:', err);
      let errorMessage = 'Registration failed. Please try again.';
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or login.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use a stronger password.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        default:
          errorMessage = err.message || 'Registration failed. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVerificationDialog = () => {
    setShowVerificationDialog(false);
    navigate(`/login/${role}`);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Button 
        onClick={() => navigate('/select-role')} 
        sx={{ 
          mb: 3, 
          color: '#5d4037',
          textTransform: 'none'
        }}
      >
        Back to Role Selection
      </Button>

      <Card sx={{ 
        borderTop: `4px solid ${currentRole.color}`, 
        borderRadius: 2, 
        backgroundColor: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ 
            color: currentRole.color, 
            fontWeight: 'bold',
            mb: 2
          }}>
            {currentRole.title}
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 4 }}>
            {currentRole.description}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <TextField 
            label={`${role.charAt(0).toUpperCase() + role.slice(1)} Name`} 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            fullWidth 
            margin="normal" 
            variant="outlined" 
            disabled={loading}
            required
            sx={{
              '& .MuiInputLabel-root.Mui-focused': {
                color: currentRole.color,
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: currentRole.color,
              }
            }}
          />
          <TextField 
            label="Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            fullWidth 
            margin="normal" 
            variant="outlined" 
            disabled={loading}
            required
            helperText="We'll send a verification link to this email"
            sx={{
              '& .MuiInputLabel-root.Mui-focused': {
                color: currentRole.color,
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: currentRole.color,
              }
            }}
          />
          <TextField 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            fullWidth 
            margin="normal" 
            variant="outlined" 
            sx={{ mb: 3 }} 
            helperText="At least 6 characters" 
            disabled={loading}
            required
          />

          <Button 
            variant="contained" 
            onClick={handleRegister} 
            fullWidth 
            size="large" 
            sx={{ 
              backgroundColor: currentRole.color, 
              py: 1.5, 
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: currentRole.color,
                opacity: 0.9
              },
              '&:disabled': {
                backgroundColor: '#e0e0e0'
              }
            }}
            disabled={loading || !name || !email || !password}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Creating Account...' : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Already have an account?{' '}
              <Button 
                onClick={() => navigate(`/login/${role}`)}
                sx={{ 
                  color: currentRole.color,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline'
                  }
                }}
              >
                Login here
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Email Verification Dialog */}
      <Dialog 
        open={showVerificationDialog} 
        onClose={handleCloseVerificationDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            backgroundColor: 'white'
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            Verify Your Email
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph color="text.primary">
            We've sent a verification link to:
          </Typography>
          <Typography variant="h6" align="center" sx={{ 
            fontWeight: 'bold',
            color: '#2c3e50',
            backgroundColor: '#f5f5f5',
            py: 1,
            px: 2,
            borderRadius: 1,
            mb: 2
          }}>
            {email}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Please check your inbox and click the verification link to activate your account. 
            If you don't see the email, check your spam folder.
          </Typography>
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            You need to verify your email before you can login. After verification, return to login to access your account.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, pt: 1 }}>
          <Button 
            variant="contained" 
            onClick={handleCloseVerificationDialog}
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontSize: '1rem',
              backgroundColor: currentRole.color
            }}
          >
            Continue to Login
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Register;