import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, Button, 
  Box, Fade, Grow, Avatar, Chip, useTheme, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, Paper, alpha,
  Alert, Tooltip
} from '@mui/material';
import { keyframes } from '@mui/system';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const RoleSelection = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedRole, setSelectedRole] = useState(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  // Professional color scheme (no blue) - Using consistent primary color
  const professionalColors = {
    primary: '#2c5530', // Professional green
    primaryDark: '#1e3a24',
    primaryLight: '#4a7c59',
    background: '#ffffff',
    cardBackground: '#f8f9fa',
    textPrimary: '#2c3e50',
    textSecondary: '#5a6c7d',
    border: '#e1e5e9',
    hover: '#f1f3f4',
  };

  const roles = [
    { 
      role: 'student', 
      title: 'Student', 
      description: 'Discover your future with personalized course recommendations and career opportunities.', 
      action: 'Start Learning Journey',
      features: [
        'Personalized course recommendations',
        'Smart job matching based on your profile',
        'Track applications and admissions',
        'Build professional portfolio',
        'Connect with top employers',
        'Upload academic transcripts',
        'Receive job notifications'
      ],
      stats: 'Join Now',
      testimonial: '"This platform helped me find the perfect university and land my dream job!"'
    },
    { 
      role: 'institute', 
      title: 'Educational Institution', 
      description: 'Showcase your programs and connect with qualified students seeking quality education.', 
      action: 'Manage Institution',
      features: [
        'Comprehensive course management',
        'Automated application processing',
        'Student performance analytics',
        'Digital document management',
        'Admission campaign tools',
        'Manage student applications',
        'Publish admissions'
      ],
      stats: 'Get Started',
      testimonial: '"Streamlined our admission process and increased qualified applications by 40%"'
    },
    { 
      role: 'company', 
      title: 'Company', 
      description: 'Find the perfect talent from our pool of qualified graduates and students.', 
      action: 'Find Talent',
      features: [
        'Powered candidate matching',
        'Streamlined recruitment process',
        'Access to student portfolios',
        'Campus recruitment tools',
        'Industry analytics dashboard',
        'Post job opportunities',
        'Filter qualified applicants'
      ],
      stats: 'Find Talent',
      testimonial: '"Found exceptional candidates that perfectly matched our requirements in days!"'
    },
    { 
      role: 'admin', 
      title: 'Platform Administrator', 
      description: 'Oversee platform operations and ensure seamless experience for all users.', 
      action: 'Manage Platform',
      features: [
        'Complete system oversight',
        'User management and analytics',
        'Platform performance monitoring',
        'Security and compliance tools',
        'Advanced reporting capabilities',
        'Manage institutions & companies',
        'Monitor system reports'
      ],
      stats: 'Platform Management',
      testimonial: '"Comprehensive tools to maintain platform excellence and user satisfaction"'
    },
  ];

  const handleRoleSelect = (role) => {
    console.log('Selected role:', role);
    const targetPath = role === 'admin' ? `/login/${role}` : `/register/${role}`;
    console.log('Navigating to:', targetPath);
    
    if (role === 'admin') {
      navigate(`/login/${role}`);
    } else {
      navigate(`/register/${role}`);
    }
  };

  const handleInfoOpen = (role) => {
    setSelectedRole(role);
    setInfoDialogOpen(true);
  };

  const handleInfoClose = () => {
    setInfoDialogOpen(false);
    setSelectedRole(null);
  };

  const RoleCard = ({ role, index }) => (
    <Grid item xs={12} md={6} lg={3} key={role.role}>
      <Grow in timeout={800 + index * 200}>
        <Card 
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: professionalColors.background,
            color: professionalColors.textPrimary,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            border: `1px solid ${professionalColors.border}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-8px)',
              background: professionalColors.hover,
              boxShadow: `0 20px 40px ${alpha('#000', 0.15)}`,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: professionalColors.primary, // Consistent color
            }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: alpha(professionalColors.primary, 0.05), // Consistent color
              animation: `${float} 6s ease-in-out infinite`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: alpha(professionalColors.primary, 0.05), // Consistent color
              animation: `${float} 4s ease-in-out infinite`,
            }}
          />

          {/* Popular Badge for Student Role */}
          {role.role === 'student' && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 2,
              }}
            >
              <Chip
                label="Most Popular"
                size="small"
                sx={{
                  background: professionalColors.primary, // Consistent color
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                }}
              />
            </Box>
          )}

          <CardContent sx={{ 
            flexGrow: 1, 
            textAlign: 'center', 
            py: 4,
            position: 'relative',
            zIndex: 1
          }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: alpha(professionalColors.primary, 0.1), // Consistent color
                mb: 3,
                border: `2px solid ${alpha(professionalColors.primary, 0.2)}`, // Consistent color
                color: professionalColors.primary, // Consistent color
                fontSize: '2rem',
                fontWeight: 'bold'
              }}
            >
              {role.title.charAt(0)}
            </Box>
            
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold',
              minHeight: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {role.title}
            </Typography>
            
            <Typography variant="body2" sx={{ 
              mb: 3,
              color: professionalColors.textSecondary,
              lineHeight: 1.6,
              minHeight: '48px'
            }}>
              {role.description}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 32 }}>
              <Chip
                label={role.stats}
                size="small"
                sx={{
                  background: alpha(professionalColors.primary, 0.1), // Consistent color
                  color: professionalColors.primary, // Consistent color
                  fontWeight: 'bold',
                }}
              />
            </Box>
          </CardContent>

          <CardActions sx={{ 
            justifyContent: 'center', 
            pb: 3,
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row', width: '100%', px: 2 }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => handleRoleSelect(role.role)}
                sx={{ 
                  flex: 1,
                  background: professionalColors.primary, // Consistent color
                  color: 'white',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&:hover': {
                    background: professionalColors.primaryDark, // Consistent color
                    transform: 'scale(1.02)',
                  },
                }}
              >
                {role.role === 'admin' ? 'Admin Login' : 'Get Started'}
              </Button>
              
              <Tooltip title="Learn more about this role">
                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => handleInfoOpen(role)}
                  sx={{ 
                    flex: isMobile ? 1 : 'none',
                    borderColor: alpha(professionalColors.primary, 0.5), // Consistent color
                    color: professionalColors.primary, // Consistent color
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: professionalColors.primary, // Consistent color
                      background: alpha(professionalColors.primary, 0.04), // Consistent color
                    }
                  }}
                >
                  Info
                </Button>
              </Tooltip>
            </Box>
          </CardActions>
        </Card>
      </Grow>
    </Grid>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      background: professionalColors.background,
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: alpha(professionalColors.primary, 0.03), // Consistent color
          animation: `${float} 8s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: alpha(professionalColors.primary, 0.03), // Consistent color
          animation: `${float} 6s ease-in-out infinite`,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
        {/* Header Section */}
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                color: professionalColors.textPrimary,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
              }}
            >
              Career Guidance & Employment Platform
            </Typography>
            
            <Typography 
              variant="h5" 
              sx={{ 
                color: professionalColors.textSecondary, 
                mb: 4, 
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 300
              }}
            >
              Connecting students, institutions, and employers in one unified ecosystem
            </Typography>

            {error && (
              <Alert severity="info" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
                {error}
              </Alert>
            )}
          </Box>
        </Fade>

        {/* Role Selection Cards */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" gutterBottom sx={{ 
            textAlign: 'center', 
            color: professionalColors.textPrimary, 
            mb: 4, 
            fontWeight: 'bold' 
          }}>
            Choose Your Path
          </Typography>
          <Grid container spacing={3}>
            {roles.map((role, index) => (
              <RoleCard key={role.role} role={role} index={index} />
            ))}
          </Grid>
        </Box>

        {/* Platform Features Section */}
        <Fade in timeout={2000}>
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h3" gutterBottom sx={{ 
              color: professionalColors.textPrimary, 
              fontWeight: 'bold', 
              mb: 2 
            }}>
              Why Choose Our Platform?
            </Typography>
            <Typography variant="h6" sx={{ 
              color: professionalColors.textSecondary, 
              mb: 6, 
              maxWidth: 600, 
              mx: 'auto' 
            }}>
              Discover the features that make us the leading career guidance platform
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
              {[
                { 
                  title: 'Powered Matching', 
                  desc: 'Smart algorithms connect students with ideal institutions and jobs' 
                },
                { 
                  title: 'Secure Platform', 
                  desc: 'Enterprise-grade security for all your data and documents' 
                },
                { 
                  title: 'Proven Success', 
                  desc: 'Thousands of successful placements and admissions' 
                },
                { 
                  title: 'Career Guidance', 
                  desc: 'Expert counseling and career path recommendations' 
                },
                { 
                  title: 'Community Network', 
                  desc: 'Connect with peers, mentors, and industry professionals' 
                },
                { 
                  title: 'Industry Partnerships', 
                  desc: 'Direct connections with top employers and institutions' 
                },
              ].map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={feature.title}>
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      background: professionalColors.background,
                      border: `1px solid ${professionalColors.border}`,
                      color: professionalColors.textPrimary,
                      height: '100%',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        borderColor: professionalColors.primary, // Consistent color
                      }
                    }}
                  >
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: alpha(professionalColors.primary, 0.1), // Consistent color
                      mb: 3,
                      color: professionalColors.primary, // Consistent color
                    }}>
                      {/* Empty circle - consistent styling */}
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: professionalColors.textSecondary, 
                      lineHeight: 1.6 
                    }}>
                      {feature.desc}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      </Container>

      {/* Role Information Dialog */}
      <Dialog 
        open={infoDialogOpen} 
        onClose={handleInfoClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: professionalColors.background,
            color: professionalColors.textPrimary,
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }
        }}
      >
        {selectedRole && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderBottom: `1px solid ${professionalColors.border}`,
              pb: 3,
              background: alpha(professionalColors.primary, 0.02), // Consistent color
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(professionalColors.primary, 0.1), // Consistent color
                  width: 60, 
                  height: 60,
                  color: professionalColors.primary, // Consistent color
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {selectedRole.title.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {selectedRole.title}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: professionalColors.textSecondary, 
                    mt: 1 
                  }}>
                    {selectedRole.description}
                  </Typography>
                </Box>
              </Box>
              <Button 
                onClick={handleInfoClose} 
                sx={{ 
                  color: professionalColors.textSecondary,
                  minWidth: 'auto',
                  padding: '8px'
                }}
              >
                Close
              </Button>
            </DialogTitle>

            <DialogContent sx={{ py: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Key Features:
              </Typography>

              <List sx={{ mb: 4 }}>
                {selectedRole.features.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <Box
                      sx={{
                        minWidth: 40,
                        height: 24,
                        borderRadius: '50%',
                        background: alpha(professionalColors.primary, 0.1), // Consistent color
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: professionalColors.primary, // Consistent color
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        mr: 2
                      }}
                    >
                      ✓
                    </Box>
                    <ListItemText 
                      primary={feature}
                      primaryTypographyProps={{ 
                        sx: { 
                          fontWeight: 500, 
                          fontSize: '1.1rem',
                          color: professionalColors.textPrimary 
                        } 
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              {/* Testimonial Section */}
              <Paper sx={{ 
                p: 3, 
                background: alpha(professionalColors.primary, 0.03), // Consistent color
                borderRadius: 2,
                border: `1px solid ${alpha(professionalColors.primary, 0.1)}` // Consistent color
              }}>
                <Typography variant="body2" sx={{ 
                  fontStyle: 'italic', 
                  mb: 1,
                  color: professionalColors.textPrimary 
                }}>
                  {selectedRole.testimonial}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: professionalColors.textSecondary 
                }}>
                  — Satisfied Platform User
                </Typography>
              </Paper>
            </DialogContent>

            <DialogActions sx={{ 
              justifyContent: 'center', 
              pb: 4,
              borderTop: `1px solid ${professionalColors.border}`,
              pt: 3,
              background: alpha(professionalColors.primary, 0.02), // Consistent color
            }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => handleRoleSelect(selectedRole.role)}
                sx={{ 
                  background: professionalColors.primary, // Consistent color
                  color: 'white',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  '&:hover': {
                    background: professionalColors.primaryDark, // Consistent color
                    transform: 'scale(1.02)',
                  }
                }}
              >
                {selectedRole.role === 'admin' ? 'Admin Login' : `Join as ${selectedRole.title}`}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RoleSelection;