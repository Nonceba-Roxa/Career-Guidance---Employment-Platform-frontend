import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, Button, 
  Box, Fade, Zoom, Slide, Grow, Avatar, Chip, useTheme, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Paper, alpha,
  CircularProgress, Alert, AppBar, Toolbar, Tooltip
} from '@mui/material';
import { 
  School, Business, AccountBalance, AdminPanelSettings,
  Close, CheckCircle, Info, Login,
  Security, AutoAwesome, Psychology, Star, Group,
  Work, Person, TrendingUp, HowToReg, Explore, CorporateFare, MenuBook
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [stats, setStats] = useState({
    students: 0,
    institutions: 0,
    companies: 0,
    jobs: 0,
    courses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Professional blue color scheme
  const professionalColors = {
    primary: '#1976d2',
    primaryDark: '#1565c0',
    primaryLight: '#42a5f5',
    gradient: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
    gradientLight: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
    gradientHover: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
  };

  // Fetch real statistics from Firebase
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('Fetching platform statistics from Firebase...');

        const [usersSnapshot, jobsSnapshot, coursesSnapshot, institutionsSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'jobs')),
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'institutions'))
        ]);

        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const institutionsFromCollection = institutionsSnapshot.docs.length;
        const institutionUsers = users.filter(u => u.role === 'institution' || u.role === 'institute').length;
        const totalInstitutions = institutionsFromCollection + institutionUsers;

        const realStats = {
          students: users.filter(u => u.role === 'student').length,
          institutions: totalInstitutions,
          companies: users.filter(u => u.role === 'company').length,
          jobs: jobsSnapshot.docs.length,
          courses: coursesSnapshot.docs.length
        };

        console.log('Real stats loaded successfully:', realStats);
        setStats(realStats);
        setError(null);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Unable to load live statistics. Showing demo data.');
        setStats({
          students: 1250,
          institutions: 45,
          companies: 120,
          jobs: 350,
          courses: 280
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const roles = [
    { 
      role: 'student', 
      title: 'Student', 
      description: 'Discover your future with personalized course recommendations and career opportunities.', 
      icon: <School sx={{ fontSize: 48 }} />,
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
      stats: loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : `${stats.students}+ Students`,
      testimonial: '"This platform helped me find the perfect university and land my dream job!"'
    },
    { 
      role: 'institute', 
      title: 'Educational Institution', 
      description: 'Showcase your programs and connect with qualified students seeking quality education.', 
      icon: <AccountBalance sx={{ fontSize: 48 }} />,
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
      stats: loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : `${stats.institutions}+ Institutions`,
      testimonial: '"Streamlined our admission process and increased qualified applications by 40%"'
    },
    { 
      role: 'company', 
      title: 'Company', 
      description: 'Find the perfect talent from our pool of qualified graduates and students.', 
      icon: <Business sx={{ fontSize: 48 }} />,
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
      stats: loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : `${stats.companies}+ Companies`,
      testimonial: '"Found exceptional candidates that perfectly matched our requirements in days!"'
    },
    { 
      role: 'admin', 
      title: 'Platform Administrator', 
      description: 'Oversee platform operations and ensure seamless experience for all users.', 
      icon: <AdminPanelSettings sx={{ fontSize: 48 }} />,
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
            background: professionalColors.gradient,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-8px)',
              background: professionalColors.gradientHover,
              boxShadow: `0 20px 40px ${alpha('#000', 0.3)}`,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'rgba(255,255,255,0.3)',
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
              background: 'rgba(255,255,255,0.1)',
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
              background: 'rgba(255,255,255,0.1)',
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
                icon={<Star sx={{ fontSize: 16 }} />}
                label="Most Popular"
                size="small"
                sx={{
                  background: 'rgba(255,255,255,0.9)',
                  color: professionalColors.primary,
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
                background: 'rgba(255,255,255,0.2)',
                mb: 3,
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              {role.icon}
            </Box>
            
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              minHeight: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {role.title}
            </Typography>
            
            <Typography variant="body2" sx={{ 
              mb: 3,
              opacity: 0.9,
              lineHeight: 1.6,
              minHeight: '48px'
            }}>
              {role.description}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 32 }}>
              {typeof role.stats === 'string' ? (
                <Chip
                  label={role.stats}
                  size="small"
                  sx={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              ) : (
                role.stats
              )}
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
                endIcon={<HowToReg />}
                sx={{ 
                  flex: 1,
                  background: 'rgba(255,255,255,0.9)',
                  color: professionalColors.primary,
                  fontWeight: 'bold',
                  '&:hover': {
                    background: 'white',
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
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      background: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  <Info />
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
      background: professionalColors.gradient,
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
          background: 'rgba(255,255,255,0.05)',
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
          background: 'rgba(255,255,255,0.05)',
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
                color: 'white',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                textShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              Career Guidance & Employment Platform
            </Typography>
            
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'white', 
                mb: 4, 
                opacity: 0.9,
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

            {/* Stats Bar */}
            <Slide in timeout={1500} direction="up">
              <Paper
                sx={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  p: 3,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 4,
                  maxWidth: 800,
                  mx: 'auto',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {[
                  { icon: <Person />, value: stats.students, label: 'Students' },
                  { icon: <School />, value: stats.institutions, label: 'Institutions' },
                  { icon: <Business />, value: stats.companies, label: 'Companies' },
                  { icon: <Work />, value: stats.jobs, label: 'Jobs Posted' },
                  { icon: <MenuBook />, value: stats.courses, label: 'Courses' },
                ].map((stat, index) => (
                  <Box key={stat.label} sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      {stat.icon}
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', ml: 1 }}>
                        {loading ? (
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                        ) : (
                          stat.value
                        )}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Slide>
          </Box>
        </Fade>

        {/* Role Selection Cards */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" gutterBottom sx={{ textAlign: 'center', color: 'white', mb: 4, fontWeight: 'bold' }}>
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
            <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
              Why Choose Our Platform?
            </Typography>
            <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, mb: 6, maxWidth: 600, mx: 'auto' }}>
              Discover the features that make us the leading career guidance platform
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
              {[
                { 
                  icon: <AutoAwesome sx={{ fontSize: 40 }} />, 
                  title: 'Powered Matching', 
                  desc: 'Smart algorithms connect students with ideal institutions and jobs' 
                },
                { 
                  icon: <Security sx={{ fontSize: 40 }} />, 
                  title: 'Secure Platform', 
                  desc: 'Enterprise-grade security for all your data and documents' 
                },
                { 
                  icon: <TrendingUp sx={{ fontSize: 40 }} />, 
                  title: 'Proven Success', 
                  desc: 'Thousands of successful placements and admissions' 
                },
                { 
                  icon: <Psychology sx={{ fontSize: 40 }} />, 
                  title: 'Career Guidance', 
                  desc: 'Expert counseling and career path recommendations' 
                },
                { 
                  icon: <Group sx={{ fontSize: 40 }} />, 
                  title: 'Community Network', 
                  desc: 'Connect with peers, mentors, and industry professionals' 
                },
                { 
                  icon: <CorporateFare sx={{ fontSize: 40 }} />, 
                  title: 'Industry Partnerships', 
                  desc: 'Direct connections with top employers and institutions' 
                },
              ].map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={feature.title}>
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        background: 'rgba(255,255,255,0.15)',
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
                      background: 'rgba(255,255,255,0.1)',
                      mb: 3
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
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
            background: professionalColors.gradient,
            color: 'white',
            borderRadius: 3
          }
        }}
      >
        {selectedRole && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              pb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                  {selectedRole.icon}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {selectedRole.title}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                    {selectedRole.description}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleInfoClose} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ py: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Key Features:
              </Typography>

              <List sx={{ mb: 4 }}>
                {selectedRole.features.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckCircle sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={feature}
                      primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '1.1rem' } }}
                    />
                  </ListItem>
                ))}
              </List>

              {/* Testimonial Section */}
              <Paper sx={{ 
                p: 3, 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                  {selectedRole.testimonial}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  — Satisfied Platform User
                </Typography>
              </Paper>
            </DialogContent>

            <DialogActions sx={{ 
              justifyContent: 'center', 
              pb: 4,
              borderTop: '1px solid rgba(255,255,255,0.2)',
              pt: 3
            }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => handleRoleSelect(selectedRole.role)}
                endIcon={<HowToReg />}
                sx={{ 
                  background: 'rgba(255,255,255,0.9)',
                  color: professionalColors.primary,
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    background: 'white',
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