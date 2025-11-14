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
      student: 'secondary',
      company: 'warning'
    };
    return colors[role] || 'default';
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#2c3e50', color: 'white', boxShadow: 1 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'white' }}>
          Career Guidance Platform
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!user ? (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/select-role')}
                sx={{ color: 'white' }}
              >
                Home
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                sx={{ color: 'white' }}
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
                sx={{ color: 'white' }}
              >
                Dashboard
              </Button>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{ color: 'white' }}
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