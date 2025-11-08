import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Chip 
} from '@mui/material';
import { Login } from '@mui/icons-material';

const NavigationBar = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/select-role');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      institute: 'success', 
      student: 'primary',
      company: 'warning'
    };
    return colors[role] || 'default';
  };

  return (
    <AppBar position="static" className="navbar">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }} className="navbar-brand">
          Career Guidance Platform
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!user ? (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/select-role')}
                className="nav-button"
              >
                Home
              </Button>
              <Button 
                color="inherit" 
                startIcon={<Login />}
                onClick={() => navigate('/login')}
                className="nav-button"
              >
                Sign In
              </Button>
            </>
          ) : (
            <>
              {profile && (
                <Chip 
                  label={profile.role?.toUpperCase()} 
                  color={getRoleColor(profile.role)}
                  size="small"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
              )}
              <Button 
                color="inherit" 
                onClick={() => navigate(`/${profile?.role || 'dashboard'}`)}
                className="nav-button"
              >
                Dashboard
              </Button>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                className="nav-button"
              >
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;