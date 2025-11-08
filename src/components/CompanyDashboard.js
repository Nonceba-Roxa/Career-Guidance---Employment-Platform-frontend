// src/components/CompanyDashboard.js
import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Table, TableBody, TableCell, TableHead, 
  TableRow, Paper, TextField, Button, Box, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, 
  LinearProgress, Chip, Avatar, IconButton, Tabs, Tab,
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Tooltip, Switch, FormControlLabel,
  CardActions, InputAdornment, MenuItem, Select,
  Stepper, Step, StepLabel, Fab,
  Menu, ListItemAvatar
} from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Business, Work, People, Add, Edit,
  Visibility, Email, Phone, LocationOn, CalendarToday,
  TrendingUp, Assignment, CheckCircle, Cancel,
  Security, DashboardCustomize,
  Notifications, Settings, Download,
  Search, LinkedIn, Language,
  AutoAwesome, Refresh,
  MoreVert, Schedule, ThumbUp, ThumbDown,
  HowToReg, PendingActions
} from '@mui/icons-material';

// Firebase Firestore imports
import { 
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CompanyDashboard = () => {
  const { user, profile, loading: authLoading, logout, updateProfile } = useAuth();
  const companyId = user?.uid;
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [qualifiedApplicants, setQualifiedApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    qualifiedApplicants: 0,
    interviewRate: 0
  });

  // Dialog states
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [viewApplicantsOpen, setViewApplicantsOpen] = useState(false);
  const [viewApplicationDetailsOpen, setViewApplicationDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedAppForAction, setSelectedAppForAction] = useState(null);

  // Form states
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    type: 'full-time',
    level: 'entry',
    requirements: {
      field: '',
      minGPA: 0,
      minExperience: 0,
      minCerts: 0,
      skills: [],
      educationLevel: 'bachelors'
    },
    location: '',
    salary: '',
    remote: false,
    benefits: '',
    deadline: '',
    status: 'active'
  });

  const [profileData, setProfileData] = useState({
    name: '',
    industry: '',
    size: '',
    location: '',
    contactEmail: '',
    phone: '',
    website: '',
    linkedin: '',
    description: '',
    foundedYear: ''
  });

  // Enhanced Firestore data fetching with better error handling
  const fetchJobsData = async () => {
    if (!companyId) return;

    try {
      console.log('Fetching jobs for company:', companyId);
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('companyId', '==', companyId)
      );

      const querySnapshot = await getDocs(jobsQuery);
      const jobsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          postedAt: data.postedAt?.toDate?.() || new Date()
        });
      });

      // Sort locally by creation date (newest first)
      jobsData.sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB - dateA;
      });

      console.log('Jobs fetched successfully:', jobsData.length);
      setJobs(jobsData);
      return jobsData;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      if (error.code === 'permission-denied') {
        enqueueSnackbar('Permission denied: Cannot access jobs. Please check security rules.', { variant: 'error' });
      } else {
        enqueueSnackbar('Error loading jobs: ' + error.message, { variant: 'error' });
      }
      return [];
    }
  };

  const fetchApplicationsData = async () => {
    if (!companyId) {
      console.log('No company ID available');
      return [];
    }

    try {
      console.log('Fetching applications for company:', companyId);
      
      // First, let's test if we can query the collection
      const applicationsRef = collection(db, 'jobApplications');
      const applicationsQuery = query(
        applicationsRef,
        where('companyId', '==', companyId)
      );

      console.log('Executing applications query...');
      const querySnapshot = await getDocs(applicationsQuery);
      console.log('Query completed, documents found:', querySnapshot.size);

      const applicationsData = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        try {
          const appData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
            appliedAt: docSnapshot.data().appliedAt?.toDate?.() || new Date()
          };

          console.log('Processing application:', appData.id, appData);

          // Fetch job data to get job title
          if (appData.jobId) {
            try {
              const jobDoc = await getDoc(doc(db, 'jobs', appData.jobId));
              if (jobDoc.exists()) {
                const jobData = jobDoc.data();
                appData.jobTitle = jobData.title || 'Unknown Job';
                appData.jobRequirements = jobData.requirements || {};
              } else {
                appData.jobTitle = appData.jobTitle || 'Job Not Found';
              }
            } catch (jobError) {
              console.warn('Could not fetch job data:', jobError);
              appData.jobTitle = appData.jobTitle || 'Unknown Job';
            }
          }

          // Fetch student profile data for better applicant information
          if (appData.userId) {
            try {
              const studentDoc = await getDoc(doc(db, 'users', appData.userId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                appData.studentName = studentData.name || appData.studentName || 'Unknown Student';
                appData.studentEmail = studentData.email || appData.studentEmail || 'No email';
                appData.gpa = studentData.gpa || appData.gpa || 0;
                appData.experience = studentData.experience || appData.experience || 0;
                appData.certificates = studentData.certificates || appData.certificates || 0;
                appData.skills = studentData.skills || appData.skills || [];
                appData.education = studentData.education || appData.education || 'Not specified';
                appData.field = studentData.field || appData.field || 'Not specified';
                appData.phone = studentData.phone || appData.phone || 'Not provided';
              } else {
                // Set default values if student doc doesn't exist
                appData.studentName = appData.studentName || 'Unknown Student';
                appData.studentEmail = appData.studentEmail || 'No email';
              }
            } catch (studentError) {
              console.warn('Could not fetch student data:', studentError);
              appData.studentName = appData.studentName || 'Unknown Student';
              appData.studentEmail = appData.studentEmail || 'No email';
            }
          }

          // Calculate match score if we have job requirements
          if (appData.jobRequirements) {
            appData.matchScore = calculateMatchScore(appData, appData.jobRequirements);
          }

          applicationsData.push(appData);
        } catch (docError) {
          console.error('Error processing document:', docSnapshot.id, docError);
        }
      }

      // Sort locally by application date (newest first)
      applicationsData.sort((a, b) => {
        const dateA = a.appliedAt || new Date(0);
        const dateB = b.appliedAt || new Date(0);
        return dateB - dateA;
      });

      console.log('Applications processed successfully:', applicationsData.length);
      setJobApplications(applicationsData);
      return applicationsData;
    } catch (error) {
      console.error('Error fetching applications:', error);
      if (error.code === 'permission-denied') {
        enqueueSnackbar('Permission denied: Cannot access job applications. Please check security rules.', { variant: 'error' });
        setJobApplications([]);
      } else if (error.code === 'failed-precondition') {
        enqueueSnackbar('Database error: Please check if you need to create composite indexes in Firebase Console.', { variant: 'error' });
      } else {
        enqueueSnackbar('Error loading applications: ' + error.message, { variant: 'error' });
      }
      return [];
    }
  };

  // Calculate match score between applicant and job requirements
  const calculateMatchScore = (applicant, jobRequirements) => {
    let score = 0;
    let maxScore = 100;

    // GPA match (25 points)
    if (jobRequirements.minGPA > 0 && applicant.gpa >= jobRequirements.minGPA) {
      score += 25;
    } else if (jobRequirements.minGPA > 0) {
      score += (applicant.gpa / jobRequirements.minGPA) * 25;
    }

    // Experience match (25 points)
    if (jobRequirements.minExperience > 0 && applicant.experience >= jobRequirements.minExperience) {
      score += 25;
    } else if (jobRequirements.minExperience > 0) {
      score += (applicant.experience / jobRequirements.minExperience) * 25;
    }

    // Skills match (30 points)
    if (jobRequirements.skills && jobRequirements.skills.length > 0 && applicant.skills) {
      const matchedSkills = applicant.skills.filter(skill => 
        jobRequirements.skills.includes(skill)
      );
      score += (matchedSkills.length / jobRequirements.skills.length) * 30;
    }

    // Education level match (20 points)
    if (jobRequirements.educationLevel && applicant.education) {
      const educationLevels = ['high-school', 'diploma', 'bachelors', 'masters', 'phd'];
      const jobLevel = educationLevels.indexOf(jobRequirements.educationLevel);
      const appLevel = educationLevels.indexOf(applicant.education.toLowerCase());
      if (appLevel >= jobLevel && appLevel >= 0 && jobLevel >= 0) {
        score += 20;
      }
    }

    return Math.min(100, Math.round(score));
  };

  // Calculate stats whenever jobs or applications change
  useEffect(() => {
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const totalApplications = jobApplications.length;
    const qualifiedCount = jobApplications.filter(app => 
      app.matchScore >= 70 || app.status === 'approved' || app.status === 'interview'
    ).length;
    
    const interviewRate = totalApplications > 0 
      ? Math.round((qualifiedCount / totalApplications) * 100) 
      : 0;

    setStats({
      totalJobs: jobs.length,
      activeJobs,
      totalApplications,
      qualifiedApplicants: qualifiedCount,
      interviewRate
    });
  }, [jobs, jobApplications]);

  // Main data loading effect
  useEffect(() => {
    if (authLoading || !companyId || !profile) return;

    if (profile?.role !== 'company') {
      enqueueSnackbar('Access Denied. Company authorization required.', { variant: 'error' });
      navigate('/login');
      return;
    }

    // Initialize profile data
    if (profile) {
      setProfileData({
        name: profile.name || profile.companyName || 'Your Company',
        industry: profile.industry || '',
        size: profile.size || '',
        location: profile.location || '',
        contactEmail: profile.contactEmail || profile.email || '',
        phone: profile.phone || '',
        website: profile.website || '',
        linkedin: profile.linkedin || '',
        description: profile.description || '',
        foundedYear: profile.foundedYear || ''
      });
    }

    // Load data
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchJobsData(),
          fetchApplicationsData()
        ]);
        enqueueSnackbar('Data loaded successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error loading data:', error);
        enqueueSnackbar('Error loading dashboard data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();

  }, [companyId, profile, authLoading]);

  const handleLogout = async () => {
    try {
      await logout();
      enqueueSnackbar('Logged out successfully', { variant: 'success' });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      enqueueSnackbar('Failed to log out: ' + error.message, { variant: 'error' });
    }
  };

  const postJob = async () => {
    if (!jobData.title.trim() || !jobData.description.trim()) {
      enqueueSnackbar('Job title and description are required', { variant: 'error' });
      return;
    }

    try {
      const newJob = {
        title: jobData.title.trim(),
        description: jobData.description.trim(),
        type: jobData.type,
        level: jobData.level,
        requirements: {
          field: jobData.requirements.field.trim(),
          minGPA: parseFloat(jobData.requirements.minGPA) || 0,
          minExperience: parseInt(jobData.requirements.minExperience) || 0,
          minCerts: parseInt(jobData.requirements.minCerts) || 0,
          skills: jobData.requirements.skills.filter(skill => skill.trim() !== ''),
          educationLevel: jobData.requirements.educationLevel
        },
        location: jobData.location.trim(),
        salary: jobData.salary.trim(),
        remote: jobData.remote,
        benefits: jobData.benefits.trim(),
        deadline: jobData.deadline,
        status: 'active',
        companyId: companyId,
        companyName: profileData.name || 'Your Company',
        createdAt: serverTimestamp(),
        postedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Posting job:', newJob);
      
      await addDoc(collection(db, 'jobs'), newJob);

      enqueueSnackbar('Job posted successfully!', { variant: 'success' });
      setAddJobOpen(false);
      
      // Reset form
      setJobData({
        title: '',
        description: '',
        type: 'full-time',
        level: 'entry',
        requirements: { 
          field: '', 
          minGPA: 0, 
          minExperience: 0, 
          minCerts: 0,
          skills: [],
          educationLevel: 'bachelors'
        },
        location: '',
        salary: '',
        remote: false,
        benefits: '',
        deadline: '',
        status: 'active'
      });
      setActiveStep(0);
      
      // Refresh jobs data
      await fetchJobsData();
    } catch (error) {
      console.error('Post job error:', error);
      if (error.code === 'permission-denied') {
        enqueueSnackbar('Permission denied: Cannot create job. Please check security rules.', { variant: 'error' });
      } else {
        enqueueSnackbar('Failed to post job: ' + error.message, { variant: 'error' });
      }
    }
  };

  const updateProfileHandler = async () => {
    try {
      await updateProfile(profileData);
      enqueueSnackbar('Company profile updated successfully', { variant: 'success' });
      setEditProfileOpen(false);
    } catch (error) {
      enqueueSnackbar('Failed to update profile: ' + error.message, { variant: 'error' });
    }
  };

  // Function to get application count for a specific job
  const getApplicationCountForJob = (jobId) => {
    return jobApplications.filter(app => app.jobId === jobId).length;
  };

  const getQualifiedApplicants = async (job) => {
    try {
      setSelectedJob(job);
      
      // Filter applications for this job and calculate match scores
      const jobApps = jobApplications.filter(app => app.jobId === job.id);
      
      // Enhanced matching algorithm
      const qualified = jobApps
        .map(app => {
          const matchScore = calculateMatchScore(app, job.requirements);
          let matchReasons = [];

          // GPA match
          if (job.requirements.minGPA > 0 && app.gpa >= job.requirements.minGPA) {
            matchReasons.push(`GPA ${app.gpa} meets requirement`);
          }

          // Experience match
          if (job.requirements.minExperience > 0 && app.experience >= job.requirements.minExperience) {
            matchReasons.push(`Experience ${app.experience} years meets requirement`);
          }

          // Skills match
          if (job.requirements.skills && job.requirements.skills.length > 0) {
            const matchedSkills = app.skills?.filter(skill => 
              job.requirements.skills.includes(skill)
            ) || [];
            if (matchedSkills.length > 0) {
              matchReasons.push(`Matches ${matchedSkills.length} required skills`);
            }
          }

          return {
            ...app,
            matchScore,
            matchReasons
          };
        })
        .filter(app => app.matchScore >= 70)
        .sort((a, b) => b.matchScore - a.matchScore);

      setQualifiedApplicants(qualified);
      setViewApplicantsOpen(true);
      enqueueSnackbar(`Found ${qualified.length} qualified applicants`, { variant: 'info' });
    } catch (error) {
      console.error('Error fetching qualified applicants:', error);
      enqueueSnackbar('Error fetching qualified applicants', { variant: 'error' });
    }
  };

  const viewApplicationDetails = (application) => {
    setSelectedApplication(application);
    setViewApplicationDetailsOpen(true);
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      console.log('Updating application:', applicationId, 'to status:', status);
      
      const applicationRef = doc(db, 'jobApplications', applicationId);
      await updateDoc(applicationRef, {
        status: status,
        updatedAt: serverTimestamp()
      });

      enqueueSnackbar(`Application status updated to ${status}`, { variant: 'success' });
      
      // Refresh applications data
      await fetchApplicationsData();
      
      // Close dialogs and menus
      setViewApplicationDetailsOpen(false);
      setActionMenuAnchor(null);
      setSelectedAppForAction(null);

    } catch (error) {
      console.error('Update status error:', error);
      if (error.code === 'permission-denied') {
        enqueueSnackbar('Permission denied: Cannot update application. Please check security rules.', { variant: 'error' });
      } else {
        enqueueSnackbar('Failed to update application status: ' + error.message, { variant: 'error' });
      }
    }
  };

  const handleActionMenuOpen = (event, application) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedAppForAction(application);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedAppForAction(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': 
      case 'hired':
        return 'success';
      case 'interview':
      case 'review':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'pending':
      case 'applied':
        return 'info';
      default: 
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <ThumbUp />;
      case 'rejected': return <ThumbDown />;
      case 'interview': return <Schedule />;
      case 'review': return <PendingActions />;
      case 'hired': return <HowToReg />;
      default: return <PendingActions />;
    }
  };

  const exportApplications = () => {
    if (jobApplications.length === 0) {
      enqueueSnackbar('No applications to export', { variant: 'warning' });
      return;
    }

    try {
      const headers = ['Name', 'Email', 'Job Title', 'Applied Date', 'Status', 'Match Score', 'GPA', 'Experience'];
      const csvData = jobApplications.map(app => [
        app.studentName || 'N/A',
        app.studentEmail || 'N/A',
        app.jobTitle || 'N/A',
        app.appliedAt?.toDate ? app.appliedAt.toDate().toLocaleDateString() : new Date(app.appliedAt).toLocaleDateString(),
        app.status || 'pending',
        app.matchScore || 'N/A',
        app.gpa || 'N/A',
        app.experience || 'N/A'
      ]);
      
      const csvContent = [headers, ...csvData].map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      enqueueSnackbar(`Exported ${jobApplications.length} applications successfully`, { variant: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      enqueueSnackbar('Failed to export applications', { variant: 'error' });
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const jobSteps = [
    'Job Details',
    'Requirements',
    'Compensation & Benefits'
  ];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Filter applications based on search and status
  const filteredApplications = jobApplications.filter(application => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      application.studentName?.toLowerCase().includes(searchLower) ||
      application.jobTitle?.toLowerCase().includes(searchLower) ||
      application.studentEmail?.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchJobsData(),
        fetchApplicationsData()
      ]);
      enqueueSnackbar('Data refreshed successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      enqueueSnackbar('Error refreshing data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ width: 200, mb: 2 }} />
          <Typography variant="h6">Loading Authentication...</Typography>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ width: 200, mb: 2 }} />
          <Typography variant="h6">Loading Company Dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  if (!companyId || profile?.role !== 'company') {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="h6" gutterBottom>
          You are not authorized to access the company dashboard.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Return to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 100, height: 100, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <Business sx={{ fontSize: 50 }} />
            </Avatar>
            <Box>
              <Typography variant="h3" gutterBottom fontWeight="bold">
                {profileData.name || 'Company Name'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn fontSize="small" />
                  <Typography variant="h6">
                    {profileData.location || 'Location not specified'}
                  </Typography>
                </Box>
                {profileData.industry && (
                  <Chip 
                    label={profileData.industry} 
                    variant="outlined" 
                    sx={{ color: 'white', borderColor: 'white' }}
                  />
                )}
                <Chip 
                  label="Verified Company" 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'white' }}
                  icon={<Security />}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={refreshData} sx={{ color: 'white' }}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Profile">
              <IconButton onClick={() => setEditProfileOpen(true)} sx={{ color: 'white' }}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Connection Status */}
      <Alert severity="success" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <CheckCircle sx={{ mr: 1 }} />
        Firestore connected - {jobApplications.length} job applications loaded from {jobs.length} jobs
      </Alert>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <Work sx={{ fontSize: 48, color: '#3498db', mb: 2 }} />
            <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
              {stats.totalJobs}
            </Typography>
            <Typography variant="h6" color="textSecondary">Total Jobs</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <Assignment sx={{ fontSize: 48, color: '#2ecc71', mb: 2 }} />
            <Typography variant="h4" color="success" gutterBottom fontWeight="bold">
              {stats.activeJobs}
            </Typography>
            <Typography variant="h6" color="textSecondary">Active Jobs</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <People sx={{ fontSize: 48, color: '#9b59b6', mb: 2 }} />
            <Typography variant="h4" color="secondary" gutterBottom fontWeight="bold">
              {stats.totalApplications}
            </Typography>
            <Typography variant="h6" color="textSecondary">Applications</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <AutoAwesome sx={{ fontSize: 48, color: '#e74c3c', mb: 2 }} />
            <Typography variant="h4" color="error" gutterBottom fontWeight="bold">
              {stats.qualifiedApplicants}
            </Typography>
            <Typography variant="h6" color="textSecondary">Qualified</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <TrendingUp sx={{ fontSize: 48, color: '#f39c12', mb: 2 }} />
            <Typography variant="h4" color="warning" gutterBottom fontWeight="bold">
              {stats.interviewRate}%
            </Typography>
            <Typography variant="h6" color="textSecondary">Interview Rate</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content with Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<DashboardCustomize />} label="Dashboard" />
          <Tab icon={<Work />} label={`Jobs (${jobs.length})`} />
          <Tab icon={<People />} label={`Applications (${jobApplications.length})`} />
          <Tab icon={<AutoAwesome />} label="Qualified Candidates" />
          <Tab icon={<Business />} label="Company Profile" />
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp /> Application Analytics
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Application Overview
                    </Typography>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                      Total Applications: <strong>{stats.totalApplications}</strong>
                    </Typography>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                      Qualified Candidates: <strong>{stats.qualifiedApplicants}</strong>
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Interview Rate: <strong>{stats.interviewRate}%</strong>
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notifications /> Quick Actions
                </Typography>
                <List>
                  <ListItem button onClick={() => setAddJobOpen(true)}>
                    <ListItemIcon><Add color="primary" /></ListItemIcon>
                    <ListItemText primary="Post New Job" secondary="Create a new job listing" />
                  </ListItem>
                  <ListItem button onClick={() => setTabValue(3)}>
                    <ListItemIcon><AutoAwesome color="primary" /></ListItemIcon>
                    <ListItemText primary="View Qualified Candidates" secondary="Find best matches" />
                  </ListItem>
                  <ListItem button onClick={exportApplications}>
                    <ListItemIcon><Download color="primary" /></ListItemIcon>
                    <ListItemText primary="Export Applications" secondary="Download as CSV" />
                  </ListItem>
                  <ListItem button onClick={() => setEditProfileOpen(true)}>
                    <ListItemIcon><Business color="primary" /></ListItemIcon>
                    <ListItemText primary="Update Profile" secondary="Edit company information" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Jobs Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Job Management ({jobs.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setAddJobOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)'
              }}
            >
              Post New Job
            </Button>
          </Box>

          <Grid container spacing={3}>
            {jobs.map(job => (
              <Grid item xs={12} md={6} lg={4} key={job.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {job.title}
                      </Typography>
                      <Chip 
                        label={job.status} 
                        color={getStatusColor(job.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {job.description.length > 100 
                        ? `${job.description.substring(0, 100)}...` 
                        : job.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2"><strong>Type:</strong> {job.type}</Typography>
                        <Typography variant="body2"><strong>Level:</strong> {job.level}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2"><strong>Location:</strong> {job.location}</Typography>
                        <Typography variant="body2"><strong>Salary:</strong> {job.salary}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {job.requirements?.field && (
                        <Chip label={job.requirements.field} size="small" variant="outlined" />
                      )}
                      {job.requirements?.minGPA > 0 && (
                        <Chip label={`GPA: ${job.requirements.minGPA}+`} size="small" variant="outlined" />
                      )}
                      {job.requirements?.minExperience > 0 && (
                        <Chip label={`Exp: ${job.requirements.minExperience}y+`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => getQualifiedApplicants(job)}
                      startIcon={<AutoAwesome />}
                    >
                      Find Candidates ({getApplicationCountForJob(job.id)})
                    </Button>
                    <Button size="small" startIcon={<Visibility />}>
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {jobs.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No jobs posted yet. Post your first job to start attracting qualified candidates!
            </Alert>
          )}
        </TabPanel>

        {/* Applications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }}
              sx={{ minWidth: 250 }}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="review">Under Review</MenuItem>
              <MenuItem value="interview">Interview</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="hired">Hired</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
            <Button 
              startIcon={<Download />} 
              onClick={exportApplications}
              variant="outlined"
              disabled={jobApplications.length === 0}
            >
              Export
            </Button>
            <Button 
              startIcon={<Refresh />} 
              onClick={refreshData}
              variant="outlined"
            >
              Refresh
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography color="textSecondary">
              Showing {filteredApplications.length} of {jobApplications.length} applications
            </Typography>
          </Box>

          {filteredApplications.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Applicant</strong></TableCell>
                  <TableCell><strong>Job Title</strong></TableCell>
                  <TableCell><strong>Qualifications</strong></TableCell>
                  <TableCell><strong>Applied Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Match Score</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map(application => (
                  <TableRow key={application.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {application.studentName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="bold">{application.studentName}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {application.studentEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{application.jobTitle}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {application.gpa > 0 && (
                          <Chip label={`GPA: ${application.gpa}`} size="small" />
                        )}
                        {application.experience > 0 && (
                          <Chip label={`${application.experience}y exp`} size="small" variant="outlined" />
                        )}
                        {application.certificates > 0 && (
                          <Chip label={`${application.certificates} certs`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {application.appliedAt ? (
                        application.appliedAt.toDate ? 
                          application.appliedAt.toDate().toLocaleDateString() :
                          new Date(application.appliedAt).toLocaleDateString()
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={application.status} 
                        color={getStatusColor(application.status)}
                        size="small"
                        icon={getStatusIcon(application.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {application.matchScore ? (
                        <Chip 
                          label={`${application.matchScore}%`}
                          color={getMatchScoreColor(application.matchScore)}
                          size="small"
                        />
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => viewApplicationDetails(application)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Quick Actions">
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleActionMenuOpen(e, application)}
                            color="info"
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="info">
              {jobApplications.length === 0 
                ? "No applications received yet. Applications will appear here when students apply to your jobs."
                : "No applications found matching your search criteria."}
            </Alert>
          )}
        </TabPanel>

        {/* Qualified Candidates Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Qualified Candidates Ready for Interview
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            These candidates have been automatically matched based on your job requirements and are ready for interview consideration.
          </Typography>

          <Grid container spacing={3}>
            {qualifiedApplicants.map((applicant, index) => (
              <Grid item xs={12} md={6} key={applicant.id || index}>
                <Card sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                        {applicant.studentName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {applicant.studentName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {applicant.studentEmail}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={`${applicant.matchScore}% Match`}
                      color={getMatchScoreColor(applicant.matchScore)}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Field:</strong> {applicant.field}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>GPA:</strong> {applicant.gpa}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Experience:</strong> {applicant.experience} years</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2"><strong>Certificates:</strong> {applicant.certificates}</Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="body2" gutterBottom><strong>Education:</strong> {applicant.education}</Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom><strong>Skills:</strong></Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {applicant.skills?.map((skill, idx) => (
                        <Chip key={idx} label={skill} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  {applicant.matchReasons && applicant.matchReasons.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom><strong>Match Reasons:</strong></Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {applicant.matchReasons.map((reason, idx) => (
                          <Chip key={idx} label={reason} size="small" color="success" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      variant="contained" 
                      startIcon={<Email />}
                      onClick={() => window.location.href = `mailto:${applicant.studentEmail}`}
                    >
                      Contact
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<Visibility />}
                      onClick={() => viewApplicationDetails(applicant)}
                    >
                      Full Profile
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {qualifiedApplicants.length === 0 && (
            <Alert severity="info">
              No qualified candidates found. Try posting jobs with specific requirements to get better matches.
            </Alert>
          )}
        </TabPanel>

        {/* Company Profile Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business /> Company Information
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<Edit />}
                  onClick={() => setEditProfileOpen(true)}
                  sx={{ mt: 1, mb: 3 }}
                >
                  Edit Profile
                </Button>
                
                <List>
                  <ListItem>
                    <ListItemIcon><Business color="primary" /></ListItemIcon>
                    <ListItemText primary="Company Name" secondary={profileData.name} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Work color="primary" /></ListItemIcon>
                    <ListItemText primary="Industry" secondary={profileData.industry || 'Not specified'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><People color="primary" /></ListItemIcon>
                    <ListItemText primary="Company Size" secondary={profileData.size || 'Not specified'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><LocationOn color="primary" /></ListItemIcon>
                    <ListItemText primary="Location" secondary={profileData.location} />
                  </ListItem>
                  {profileData.foundedYear && (
                    <ListItem>
                      <ListItemIcon><CalendarToday color="primary" /></ListItemIcon>
                      <ListItemText primary="Founded" secondary={profileData.foundedYear} />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Settings /> Contact & Settings
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Email color="primary" /></ListItemIcon>
                    <ListItemText primary="Contact Email" secondary={profileData.contactEmail} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Phone color="primary" /></ListItemIcon>
                    <ListItemText primary="Phone" secondary={profileData.phone || 'Not specified'} />
                  </ListItem>
                  {profileData.website && (
                    <ListItem>
                      <ListItemIcon><Language color="primary" /></ListItemIcon>
                      <ListItemText primary="Website" secondary={profileData.website} />
                    </ListItem>
                  )}
                  {profileData.linkedin && (
                    <ListItem>
                      <ListItemIcon><LinkedIn color="primary" /></ListItemIcon>
                      <ListItemText primary="LinkedIn" secondary={profileData.linkedin} />
                    </ListItem>
                  )}
                </List>

                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Preferences</Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Auto-Match Candidates" 
                      secondary="Automatically find qualified applicants" 
                    />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Email Notifications" 
                      secondary="Receive alerts for new applications" 
                    />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Public Profile" 
                      secondary="Show company in job searches" 
                    />
                    <Switch defaultChecked />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Add Job Dialog with Stepper */}
      <Dialog open={addJobOpen} onClose={() => setAddJobOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Work /> Post New Job
          </Box>
          <Stepper activeStep={activeStep} sx={{ mt: 3 }}>
            {jobSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </DialogTitle>
        <DialogContent>
          {/* Step 1: Job Details */}
          {activeStep === 0 && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Job Title"
                value={jobData.title}
                onChange={e => setJobData({...jobData, title: e.target.value})}
                fullWidth
                required
                margin="normal"
                placeholder="e.g., Senior Software Engineer"
              />
              <TextField
                label="Job Description"
                value={jobData.description}
                onChange={e => setJobData({...jobData, description: e.target.value})}
                multiline
                rows={4}
                fullWidth
                required
                margin="normal"
                placeholder="Describe the role, responsibilities, and what you're looking for..."
              />
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Select
                    value={jobData.type}
                    onChange={e => setJobData({...jobData, type: e.target.value})}
                    fullWidth
                    margin="normal"
                  >
                    <MenuItem value="full-time">Full Time</MenuItem>
                    <MenuItem value="part-time">Part Time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="internship">Internship</MenuItem>
                    <MenuItem value="remote">Remote</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Select
                    value={jobData.level}
                    onChange={e => setJobData({...jobData, level: e.target.value})}
                    fullWidth
                    margin="normal"
                  >
                    <MenuItem value="entry">Entry Level</MenuItem>
                    <MenuItem value="mid">Mid Level</MenuItem>
                    <MenuItem value="senior">Senior Level</MenuItem>
                    <MenuItem value="executive">Executive</MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 2: Requirements */}
          {activeStep === 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Qualifications & Requirements</Typography>
              
              <TextField
                label="Field/Industry"
                value={jobData.requirements.field}
                onChange={e => setJobData({
                  ...jobData, 
                  requirements: { ...jobData.requirements, field: e.target.value }
                })}
                fullWidth
                margin="normal"
                placeholder="e.g., Information Technology, Marketing"
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Minimum GPA"
                    type="number"
                    value={jobData.requirements.minGPA}
                    onChange={e => setJobData({
                      ...jobData, 
                      requirements: { ...jobData.requirements, minGPA: parseFloat(e.target.value) || 0 }
                    })}
                    fullWidth
                    margin="normal"
                    inputProps={{ min: 0, max: 4, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Minimum Experience (years)"
                    type="number"
                    value={jobData.requirements.minExperience}
                    onChange={e => setJobData({
                      ...jobData, 
                      requirements: { ...jobData.requirements, minExperience: parseInt(e.target.value) || 0 }
                    })}
                    fullWidth
                    margin="normal"
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Minimum Certificates"
                type="number"
                value={jobData.requirements.minCerts}
                onChange={e => setJobData({
                  ...jobData, 
                  requirements: { ...jobData.requirements, minCerts: parseInt(e.target.value) || 0 }
                })}
                fullWidth
                margin="normal"
                inputProps={{ min: 0 }}
              />

              <Select
                value={jobData.requirements.educationLevel}
                onChange={e => setJobData({
                  ...jobData, 
                  requirements: { ...jobData.requirements, educationLevel: e.target.value }
                })}
                fullWidth
                margin="normal"
              >
                <MenuItem value="high-school">High School</MenuItem>
                <MenuItem value="diploma">Diploma</MenuItem>
                <MenuItem value="bachelors">Bachelor's Degree</MenuItem>
                <MenuItem value="masters">Master's Degree</MenuItem>
                <MenuItem value="phd">PhD</MenuItem>
              </Select>

              <TextField
                label="Required Skills (comma separated)"
                value={jobData.requirements.skills.join(', ')}
                onChange={e => setJobData({
                  ...jobData, 
                  requirements: { ...jobData.requirements, skills: e.target.value.split(',').map(s => s.trim()) }
                })}
                fullWidth
                margin="normal"
                placeholder="e.g., JavaScript, React, Project Management"
              />
            </Box>
          )}

          {/* Step 3: Compensation & Benefits */}
          {activeStep === 2 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Compensation & Details</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Location"
                    value={jobData.location}
                    onChange={e => setJobData({...jobData, location: e.target.value})}
                    fullWidth
                    margin="normal"
                    placeholder="e.g., Maseru, Lesotho"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Salary Range"
                    value={jobData.salary}
                    onChange={e => setJobData({...jobData, salary: e.target.value})}
                    fullWidth
                    margin="normal"
                    placeholder="e.g., M10,000 - M15,000"
                  />
                </Grid>
              </Grid>

              <FormControlLabel
                control={
                  <Switch
                    checked={jobData.remote}
                    onChange={e => setJobData({...jobData, remote: e.target.checked})}
                  />
                }
                label="Remote Work Available"
                sx={{ mt: 2 }}
              />

              <TextField
                label="Application Deadline"
                type="date"
                value={jobData.deadline}
                onChange={e => setJobData({...jobData, deadline: e.target.value})}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Benefits & Perks"
                value={jobData.benefits}
                onChange={e => setJobData({...jobData, benefits: e.target.value})}
                multiline
                rows={3}
                fullWidth
                margin="normal"
                placeholder="Health insurance, flexible hours, professional development..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBack} disabled={activeStep === 0}>
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === jobSteps.length - 1 ? (
            <Button 
              onClick={postJob}
              variant="contained"
              disabled={!jobData.title.trim() || !jobData.description.trim()}
              sx={{
                background: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)'
              }}
            >
              Post Job
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained">
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business /> Edit Company Profile
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Company Name"
                value={profileData.name}
                onChange={e => setProfileData({...profileData, name: e.target.value})}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Industry"
                value={profileData.industry}
                onChange={e => setProfileData({...profileData, industry: e.target.value})}
                fullWidth
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Company Size"
                value={profileData.size}
                onChange={e => setProfileData({...profileData, size: e.target.value})}
                fullWidth
                placeholder="e.g., 1-10, 11-50, 51-200"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Location"
                value={profileData.location}
                onChange={e => setProfileData({...profileData, location: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Email"
                type="email"
                value={profileData.contactEmail}
                onChange={e => setProfileData({...profileData, contactEmail: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                value={profileData.phone}
                onChange={e => setProfileData({...profileData, phone: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Website"
                value={profileData.website}
                onChange={e => setProfileData({...profileData, website: e.target.value})}
                fullWidth
                placeholder="https://..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="LinkedIn"
                value={profileData.linkedin}
                onChange={e => setProfileData({...profileData, linkedin: e.target.value})}
                fullWidth
                placeholder="https://linkedin.com/company/..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Founded Year"
                type="number"
                value={profileData.foundedYear}
                onChange={e => setProfileData({...profileData, foundedYear: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Company Description"
                value={profileData.description}
                onChange={e => setProfileData({...profileData, description: e.target.value})}
                fullWidth
                multiline
                rows={4}
                placeholder="Tell us about your company culture, mission, and values..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileOpen(false)}>Cancel</Button>
          <Button 
            onClick={updateProfileHandler}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)'
            }}
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Application Details Dialog */}
      <Dialog open={viewApplicationDetailsOpen} onClose={() => setViewApplicationDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Application Details
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                    {selectedApplication.studentName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedApplication.studentName}</Typography>
                    <Typography color="textSecondary">{selectedApplication.studentEmail}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>Applicant Information</Typography>
                <Typography><strong>Name:</strong> {selectedApplication.studentName}</Typography>
                <Typography><strong>Email:</strong> {selectedApplication.studentEmail}</Typography>
                <Typography><strong>Phone:</strong> {selectedApplication.studentPhone || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>Job Information</Typography>
                <Typography><strong>Position:</strong> {selectedApplication.jobTitle}</Typography>
                <Typography><strong>Applied:</strong> {
                  selectedApplication.appliedAt?.toDate ? 
                    selectedApplication.appliedAt.toDate().toLocaleDateString() :
                    new Date(selectedApplication.appliedAt).toLocaleDateString()
                }</Typography>
                <Typography><strong>Status:</strong> 
                  <Chip 
                    label={selectedApplication.status} 
                    color={getStatusColor(selectedApplication.status)}
                    size="small"
                    sx={{ ml: 1 }}
                    icon={getStatusIcon(selectedApplication.status)}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Qualifications</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedApplication.gpa && (
                    <Chip label={`GPA: ${selectedApplication.gpa}`} color="primary" />
                  )}
                  {selectedApplication.experience > 0 && (
                    <Chip label={`${selectedApplication.experience} years experience`} color="secondary" />
                  )}
                  {selectedApplication.certificates > 0 && (
                    <Chip label={`${selectedApplication.certificates} certificates`} color="success" />
                  )}
                  {selectedApplication.matchScore && (
                    <Chip 
                      label={`Match Score: ${selectedApplication.matchScore}%`} 
                      color={getMatchScoreColor(selectedApplication.matchScore)}
                    />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Application Status</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip 
                    label={selectedApplication.status} 
                    color={getStatusColor(selectedApplication.status)}
                    size="medium"
                    icon={getStatusIcon(selectedApplication.status)}
                  />
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="warning"
                    startIcon={<PendingActions />}
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'review')}
                  >
                    Mark for Review
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="info"
                    startIcon={<Schedule />}
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'interview')}
                  >
                    Schedule Interview
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="success"
                    startIcon={<ThumbUp />}
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="error"
                    startIcon={<ThumbDown />}
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewApplicationDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu for Quick Status Updates */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem 
          onClick={() => updateApplicationStatus(selectedAppForAction?.id, 'review')}
          sx={{ color: 'warning.main' }}
        >
          <ListItemIcon>
            <PendingActions color="warning" />
          </ListItemIcon>
          <ListItemText>Mark for Review</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => updateApplicationStatus(selectedAppForAction?.id, 'interview')}
          sx={{ color: 'info.main' }}
        >
          <ListItemIcon>
            <Schedule color="info" />
          </ListItemIcon>
          <ListItemText>Schedule Interview</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => updateApplicationStatus(selectedAppForAction?.id, 'approved')}
          sx={{ color: 'success.main' }}
        >
          <ListItemIcon>
            <ThumbUp color="success" />
          </ListItemIcon>
          <ListItemText>Approve Application</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => updateApplicationStatus(selectedAppForAction?.id, 'hired')}
          sx={{ color: 'success.main' }}
        >
          <ListItemIcon>
            <HowToReg color="success" />
          </ListItemIcon>
          <ListItemText>Mark as Hired</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => updateApplicationStatus(selectedAppForAction?.id, 'rejected')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <ThumbDown color="error" />
          </ListItemIcon>
          <ListItemText>Reject Application</ListItemText>
        </MenuItem>
      </Menu>

      {/* Floating Action Button for Quick Job Post */}
      <Fab 
        color="primary" 
        aria-label="add job"
        onClick={() => setAddJobOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #f39c12, #e74c3c)'
        }}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default () => (
  <SnackbarProvider 
    maxSnack={3}
    anchorOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
  >
    <CompanyDashboard />
  </SnackbarProvider>
);