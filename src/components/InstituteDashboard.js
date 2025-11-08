// src/components/InstituteDashboard.js
import React, { useEffect, useState, useRef } from 'react';
import { 
  Container, Typography, Table, TableBody, TableCell, TableHead, 
  TableRow, Paper, Select, MenuItem, TextField, Button, Box, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, 
  LinearProgress, Chip, Card, CardContent, Avatar, IconButton,
  Tabs, Tab, List, ListItem, ListItemText, ListItemIcon,
  Divider, Tooltip, Badge, Switch, FormControlLabel,
  Rating, CardActions, Collapse, InputAdornment,
  CircularProgress
} from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  School, Groups, Class, Publish, Add, Edit, Delete,
  Visibility, Email, Phone, LocationOn, CalendarToday,
  TrendingUp, People, Assignment, CheckCircle, Cancel,
  ExpandMore, ExpandLess, Security, DashboardCustomize,
  Notifications, Settings, AccountCircle, BarChart,
  FilterList, Search, Download, Upload, Star,
  Close
} from '@mui/icons-material';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  updateDoc,
  doc,
  addDoc,
  getDocs,
  serverTimestamp,
  deleteDoc
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

const InstituteDashboard = () => {
  const { user, profile, loading: authLoading, logout, updateProfile } = useAuth();
  const instituteId = user?.uid;
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalApplications: 0,
    admitted: 0,
    rejected: 0,
    pending: 0,
    admissionRate: 0
  });

  // Dialog states
  const [addFacultyOpen, setAddFacultyOpen] = useState(false);
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [viewApplicationOpen, setViewApplicationOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  
  // NEW: Edit states for faculties and courses
  const [editFacultyOpen, setEditFacultyOpen] = useState(false);
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [viewCoursesOpen, setViewCoursesOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedFacultyCourses, setSelectedFacultyCourses] = useState([]);

  // Form states
  const [facultyData, setFacultyData] = useState({ name: '', description: '' });
  const [courseData, setCourseData] = useState({
    facultyId: '',
    name: '',
    description: '',
    duration: '',
    fees: '',
    requirements: { 
      minGPA: 0, 
      subjects: [],
      entranceExam: false 
    },
    seats: 0
  });
  const [profileData, setProfileData] = useState({
    name: '',
    location: '',
    contactEmail: '',
    phone: '',
    website: '',
    description: '',
    establishedYear: ''
  });

  // SIMPLIFIED Firestore data fetching - No complex queries
  const fetchApplicationsData = async () => {
    if (!instituteId) return;

    try {
      console.log('Fetching applications for institute:', instituteId);
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('instituteId', '==', instituteId)
      );

      const querySnapshot = await getDocs(applicationsQuery);
      const applicationsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        applicationsData.push({
          id: doc.id,
          ...data,
          appliedAt: data.appliedAt?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });

      // Sort locally by application date (newest first)
      applicationsData.sort((a, b) => {
        const dateA = a.appliedAt || new Date(0);
        const dateB = b.appliedAt || new Date(0);
        return dateB - dateA;
      });

      console.log('Applications fetched successfully:', applicationsData.length);
      setApplications(applicationsData);
      calculateStats(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      enqueueSnackbar('Error loading applications: ' + error.message, { variant: 'error' });
    }
  };

  const fetchCoursesData = async () => {
    if (!instituteId) return;

    try {
      console.log('Fetching courses for institute:', instituteId);
      const coursesQuery = query(
        collection(db, 'courses'),
        where('instituteId', '==', instituteId)
      );

      const querySnapshot = await getDocs(coursesQuery);
      const coursesData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        coursesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });

      console.log('Courses fetched successfully:', coursesData.length);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      enqueueSnackbar('Error loading courses: ' + error.message, { variant: 'error' });
    }
  };

  const fetchFacultiesData = async () => {
    if (!instituteId) return;

    try {
      console.log('Fetching faculties for institute:', instituteId);
      const facultiesQuery = query(
        collection(db, 'faculties'),
        where('instituteId', '==', instituteId)
      );

      const querySnapshot = await getDocs(facultiesQuery);
      const facultiesData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        facultiesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });

      console.log('Faculties fetched successfully:', facultiesData.length);
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      enqueueSnackbar('Error loading faculties: ' + error.message, { variant: 'error' });
    }
  };

  const fetchAdmittedStudents = async () => {
    if (!instituteId) return;

    try {
      console.log('Fetching admitted students for institute:', instituteId);
      const studentsQuery = query(
        collection(db, 'applications'),
        where('instituteId', '==', instituteId),
        where('status', '==', 'admitted')
      );

      const querySnapshot = await getDocs(studentsQuery);
      const studentsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        studentsData.push({
          id: doc.id,
          ...data,
          appliedAt: data.appliedAt?.toDate?.() || new Date(),
          admittedAt: data.admittedAt?.toDate?.() || new Date()
        });
      });

      console.log('Admitted students fetched successfully:', studentsData.length);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching admitted students:', error);
      enqueueSnackbar('Error loading students: ' + error.message, { variant: 'error' });
    }
  };

  const calculateStats = (apps) => {
    const total = apps.length;
    const admitted = apps.filter(a => a.status === 'admitted').length;
    const rejected = apps.filter(a => a.status === 'rejected').length;
    const pending = apps.filter(a => !a.status || a.status === 'pending').length;
    const admissionRate = total > 0 ? ((admitted / total) * 100).toFixed(1) : 0;

    setStats({
      totalApplications: total,
      admitted,
      rejected,
      pending,
      admissionRate
    });
  };

  // NEW: Function to view courses for a specific faculty
  const viewFacultyCourses = (faculty) => {
    setSelectedFaculty(faculty);
    const facultyCourses = courses.filter(course => course.facultyId === faculty.id);
    setSelectedFacultyCourses(facultyCourses);
    setViewCoursesOpen(true);
  };

  // NEW: Function to edit faculty
  const editFaculty = (faculty) => {
    setSelectedFaculty(faculty);
    setFacultyData({
      name: faculty.name || '',
      description: faculty.description || ''
    });
    setEditFacultyOpen(true);
  };

  // NEW: Function to update faculty
  const updateFaculty = async () => {
    if (!selectedFaculty || !facultyData.name.trim()) {
      enqueueSnackbar('Faculty name is required', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const facultyRef = doc(db, 'faculties', selectedFaculty.id);
      await updateDoc(facultyRef, {
        name: facultyData.name.trim(),
        description: facultyData.description.trim(),
        updatedAt: serverTimestamp()
      });

      enqueueSnackbar('Faculty updated successfully!', { variant: 'success' });
      setEditFacultyOpen(false);
      setSelectedFaculty(null);
      setFacultyData({ name: '', description: '' });
      
      // Refresh faculties data
      await fetchFacultiesData();
      
    } catch (error) {
      console.error('Update faculty error:', error);
      enqueueSnackbar(`Failed to update faculty: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // NEW: Function to delete faculty
  const deleteFaculty = async (faculty) => {
    if (!window.confirm(`Are you sure you want to delete "${faculty.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Check if faculty has courses
      const facultyCourses = courses.filter(course => course.facultyId === faculty.id);
      if (facultyCourses.length > 0) {
        enqueueSnackbar(`Cannot delete faculty. It has ${facultyCourses.length} course(s) associated. Please delete or reassign the courses first.`, { variant: 'error' });
        return;
      }

      const facultyRef = doc(db, 'faculties', faculty.id);
      await deleteDoc(facultyRef);

      enqueueSnackbar('Faculty deleted successfully!', { variant: 'success' });
      
      // Refresh faculties data
      await fetchFacultiesData();
      
    } catch (error) {
      console.error('Delete faculty error:', error);
      enqueueSnackbar(`Failed to delete faculty: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // NEW: Function to edit course
  const editCourse = (course) => {
    setSelectedCourse(course);
    setCourseData({
      facultyId: course.facultyId || '',
      name: course.name || '',
      description: course.description || '',
      duration: course.duration || '',
      fees: course.fees || '',
      requirements: course.requirements || { minGPA: 0, subjects: [], entranceExam: false },
      seats: course.seats || 0
    });
    setEditCourseOpen(true);
  };

  // NEW: Function to update course
  const updateCourse = async () => {
    if (!selectedCourse || !courseData.facultyId || !courseData.name.trim()) {
      enqueueSnackbar('Please select a faculty and enter a course name', { variant: 'error' });
      return;
    }

    try {
      const selectedFaculty = faculties.find(f => f.id === courseData.facultyId);
      
      const courseRef = doc(db, 'courses', selectedCourse.id);
      await updateDoc(courseRef, {
        ...courseData,
        facultyName: selectedFaculty?.name || 'Unknown Faculty',
        updatedAt: serverTimestamp()
      });

      enqueueSnackbar('Course updated successfully', { variant: 'success' });
      setEditCourseOpen(false);
      setSelectedCourse(null);
      setCourseData({
        facultyId: '',
        name: '',
        description: '',
        duration: '',
        fees: '',
        requirements: { minGPA: 0, subjects: [], entranceExam: false },
        seats: 0
      });
      
      // Refresh courses data
      await fetchCoursesData();
      
    } catch (error) {
      console.error('Update course error:', error);
      enqueueSnackbar('Failed to update course: ' + error.message, { variant: 'error' });
    }
  };

  // NEW: Function to delete course
  const deleteCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to delete "${course.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      // Check if course has applications
      const courseApplications = applications.filter(app => app.courseId === course.id);
      if (courseApplications.length > 0) {
        enqueueSnackbar(`Cannot delete course. It has ${courseApplications.length} application(s) associated.`, { variant: 'error' });
        return;
      }

      const courseRef = doc(db, 'courses', course.id);
      await deleteDoc(courseRef);

      enqueueSnackbar('Course deleted successfully!', { variant: 'success' });
      
      // Refresh courses data
      await fetchCoursesData();
      
    } catch (error) {
      console.error('Delete course error:', error);
      enqueueSnackbar(`Failed to delete course: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // NEW: Function to view course applications
  const viewCourseApplications = (course) => {
    setSelectedCourse(course);
    // Filter applications for this course and set tab to applications
    const courseApplications = applications.filter(app => app.courseId === course.id);
    setFilteredApplications(courseApplications);
    setTabValue(1); // Switch to applications tab
    setSearchTerm(course.name); // Pre-fill search with course name
    setStatusFilter('all');
    
    enqueueSnackbar(`Showing ${courseApplications.length} applications for ${course.name}`, { variant: 'info' });
  };

  // Main data loading effect
  useEffect(() => {
    if (authLoading || !instituteId || !profile) return;

    if (profile?.role !== 'institute') {
      enqueueSnackbar('Access Denied. You are not authorized as institute.', { variant: 'error' });
      navigate('/login');
      return;
    }

    // Initialize profile data
    if (profile) {
      setProfileData({
        name: profile.name || '',
        location: profile.location || '',
        contactEmail: profile.contactEmail || '',
        phone: profile.phone || '',
        website: profile.website || '',
        description: profile.description || '',
        establishedYear: profile.establishedYear || ''
      });
    }

    // Load data
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchApplicationsData(),
          fetchCoursesData(),
          fetchFacultiesData(),
          fetchAdmittedStudents()
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

  }, [instituteId, profile, authLoading]);

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

  const addFaculty = async () => {
    if (!facultyData.name.trim()) {
      enqueueSnackbar('Faculty name is required', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      const facultyPayload = {
        name: facultyData.name.trim(),
        description: facultyData.description.trim(),
        instituteId: instituteId,
        instituteName: profileData.name || 'Unknown Institution',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };

      // Add directly to Firebase
      await addDoc(collection(db, 'faculties'), facultyPayload);

      enqueueSnackbar('Faculty added successfully!', { variant: 'success' });
      setAddFacultyOpen(false);
      setFacultyData({ name: '', description: '' });
      
      // Refresh faculties data
      await fetchFacultiesData();
      
    } catch (error) {
      console.error('Add faculty error:', error);
      enqueueSnackbar(`Failed to add faculty: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async () => {
    if (!courseData.facultyId || !courseData.name.trim()) {
      enqueueSnackbar('Please select a faculty and enter a course name', { variant: 'error' });
      return;
    }

    try {
      const selectedFaculty = faculties.find(f => f.id === courseData.facultyId);
      
      const coursePayload = {
        ...courseData,
        facultyName: selectedFaculty?.name || 'Unknown Faculty',
        instituteId,
        instituteName: profileData.name || 'Unknown Institution',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };

      // Add directly to Firebase
      await addDoc(collection(db, 'courses'), coursePayload);

      enqueueSnackbar('Course added successfully', { variant: 'success' });
      setAddCourseOpen(false);
      setCourseData({
        facultyId: '',
        name: '',
        description: '',
        duration: '',
        fees: '',
        requirements: { minGPA: 0, subjects: [], entranceExam: false },
        seats: 0
      });
      
      // Refresh courses data
      await fetchCoursesData();
      
    } catch (error) {
      console.error('Add course error:', error);
      enqueueSnackbar('Failed to add course: ' + error.message, { variant: 'error' });
    }
  };

  const updateProfileHandler = async () => {
    try {
      await updateProfile(profileData);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      setEditProfileOpen(false);
    } catch (error) {
      enqueueSnackbar('Failed to update profile: ' + error.message, { variant: 'error' });
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, { 
        status,
        updatedAt: serverTimestamp(),
        reviewedAt: serverTimestamp(),
        ...(status === 'admitted' && { admittedAt: serverTimestamp() })
      });
      
      enqueueSnackbar(`Application status updated to ${status}`, { variant: 'success' });
      
      // Refresh applications and students data
      await Promise.all([
        fetchApplicationsData(),
        fetchAdmittedStudents()
      ]);
      
    } catch (error) {
      console.error('Update status error:', error);
      enqueueSnackbar('Failed to update status: ' + error.message, { variant: 'error' });
    }
  };

  const publishAdmissions = async () => {
    try {
      // Update all pending applications to published status
      const pendingApplications = applications.filter(app => !app.status || app.status === 'pending');
      
      const updatePromises = pendingApplications.map(async (app) => {
        const appRef = doc(db, 'applications', app.id);
        await updateDoc(appRef, {
          status: 'published',
          publishedAt: serverTimestamp()
        });
      });
      
      await Promise.all(updatePromises);
      
      enqueueSnackbar('Admissions published successfully! Students can now view their status.', { variant: 'success' });
      
      // Refresh applications data
      await fetchApplicationsData();
      
    } catch (error) {
      console.error('Publish admissions error:', error);
      enqueueSnackbar('Failed to publish admissions: ' + error.message, { variant: 'error' });
    }
  };

  const viewApplicationDetails = (application) => {
    setSelectedApplication(application);
    setViewApplicationOpen(true);
  };

  const exportApplications = () => {
    if (applications.length === 0) {
      enqueueSnackbar('No applications to export', { variant: 'warning' });
      return;
    }

    try {
      const headers = ['Name', 'Email', 'Course', 'GPA', 'Status', 'Applied Date'];
      const csvData = applications.map(app => [
        app.studentName || 'N/A',
        app.studentEmail || 'N/A',
        app.courseName || 'N/A',
        app.studentGPA || 'N/A',
        app.status || 'pending',
        formatDate(app.appliedAt)
      ]);
      
      const csvContent = [headers, ...csvData].map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      enqueueSnackbar(`Exported ${applications.length} applications successfully`, { variant: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      enqueueSnackbar('Failed to export applications', { variant: 'error' });
    }
  };

  // Format date helper function
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      } else {
        return new Date(timestamp).toLocaleDateString();
      }
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchApplicationsData(),
        fetchCoursesData(),
        fetchFacultiesData(),
        fetchAdmittedStudents()
      ]);
      enqueueSnackbar('Data refreshed successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      enqueueSnackbar('Error refreshing data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter applications based on search and status
  const filteredApplications = applications.filter(application => {
    const matchesSearch = application.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'admitted': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
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
          <Typography variant="h6">Loading Institute Dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  if (!instituteId || profile?.role !== 'institute') {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="h6" gutterBottom>
          You are not authorized to access the institute dashboard.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Return to Login
        </Button>
      </Container>
    );
  }

  const instituteCourses = courses.filter(c => c.instituteId === instituteId);

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 100, height: 100, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <School sx={{ fontSize: 50 }} />
            </Avatar>
            <Box>
              <Typography variant="h3" gutterBottom fontWeight="bold">
                {profileData.name || 'Institution Name'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn fontSize="small" />
                  <Typography variant="h6">
                    {profileData.location || 'Location not specified'}
                  </Typography>
                </Box>
                {profileData.establishedYear && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarToday fontSize="small" />
                    <Typography variant="h6">
                      Est. {profileData.establishedYear}
                    </Typography>
                  </Box>
                )}
                <Chip 
                  label="Institute Account" 
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
                <Download />
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
        Firestore connected - {applications.length} applications loaded from {instituteCourses.length} courses
      </Alert>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <People sx={{ fontSize: 48, color: '#3498db', mb: 2 }} />
            <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
              {stats.totalApplications}
            </Typography>
            <Typography variant="h6" color="textSecondary">Total Applications</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CheckCircle sx={{ fontSize: 48, color: '#2ecc71', mb: 2 }} />
            <Typography variant="h4" color="success" gutterBottom fontWeight="bold">
              {stats.admitted}
            </Typography>
            <Typography variant="h6" color="textSecondary">Admitted</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <Cancel sx={{ fontSize: 48, color: '#e74c3c', mb: 2 }} />
            <Typography variant="h4" color="error" gutterBottom fontWeight="bold">
              {stats.rejected}
            </Typography>
            <Typography variant="h6" color="textSecondary">Rejected</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <Assignment sx={{ fontSize: 48, color: '#f39c12', mb: 2 }} />
            <Typography variant="h4" color="warning" gutterBottom fontWeight="bold">
              {stats.pending}
            </Typography>
            <Typography variant="h6" color="textSecondary">Pending</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <TrendingUp sx={{ fontSize: 48, color: '#9b59b6', mb: 2 }} />
            <Typography variant="h4" color="secondary" gutterBottom fontWeight="bold">
              {stats.admissionRate}%
            </Typography>
            <Typography variant="h6" color="textSecondary">Admission Rate</Typography>
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
          <Tab icon={<Assignment />} label={`Applications (${applications.length})`} />
          <Tab icon={<Class />} label={`Faculties (${faculties.length})`} />
          <Tab icon={<School />} label={`Courses (${instituteCourses.length})`} />
          <Tab icon={<People />} label="Students" />
          <Tab icon={<Settings />} label="Settings" />
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
                      Admitted Students: <strong>{stats.admitted}</strong>
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Admission Rate: <strong>{stats.admissionRate}%</strong>
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
                  <ListItem button onClick={() => setAddCourseOpen(true)}>
                    <ListItemIcon><Add color="primary" /></ListItemIcon>
                    <ListItemText primary="Add New Course" secondary="Create a new course offering" />
                  </ListItem>
                  <ListItem button onClick={() => setAddFacultyOpen(true)}>
                    <ListItemIcon><Add color="primary" /></ListItemIcon>
                    <ListItemText primary="Add New Faculty" secondary="Create a new faculty department" />
                  </ListItem>
                  <ListItem button onClick={publishAdmissions}>
                    <ListItemIcon><Publish color="primary" /></ListItemIcon>
                    <ListItemText primary="Publish Admissions" secondary="Make admission results public" />
                  </ListItem>
                  <ListItem button onClick={exportApplications}>
                    <ListItemIcon><Download color="primary" /></ListItemIcon>
                    <ListItemText primary="Export Data" secondary="Download applications as CSV" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Applications Tab */}
        <TabPanel value={tabValue} index={1}>
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
              <MenuItem value="admitted">Admitted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
            <Button 
              startIcon={<Download />} 
              onClick={exportApplications}
              variant="outlined"
              disabled={applications.length === 0}
            >
              Export
            </Button>
            <Button 
              startIcon={<Download />} 
              onClick={refreshData}
              variant="outlined"
            >
              Refresh
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography color="textSecondary">
              Showing {filteredApplications.length} of {applications.length} applications
            </Typography>
          </Box>

          {filteredApplications.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell><strong>Course & Faculty</strong></TableCell>
                  <TableCell><strong>Academic Info</strong></TableCell>
                  <TableCell><strong>Applied Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map(application => (
                  <TableRow key={application.id} hover>
                    <TableCell>
                      <Box>
                        <Typography fontWeight="bold">{application.studentName || 'Unknown Student'}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {application.studentEmail || 'No email'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{application.courseName || 'Unknown Course'}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {application.facultyName || 'Unknown Faculty'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={`GPA: ${application.studentGPA || 'N/A'}`} 
                          color={application.studentGPA >= 3.0 ? 'success' : 'warning'}
                          size="small"
                        />
                        {application.entranceScore && (
                          <Chip 
                            label={`Entrance: ${application.entranceScore}`} 
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {formatDate(application.appliedAt)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={application.status || 'pending'} 
                        color={getStatusColor(application.status)}
                        variant={(application.status || 'pending') === 'pending' ? 'outlined' : 'filled'}
                      />
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
                        <Tooltip title="Admit Student">
                          <IconButton 
                            size="small" 
                            onClick={() => updateApplicationStatus(application.id, 'admitted')}
                            color="success"
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject Application">
                          <IconButton 
                            size="small" 
                            onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            color="error"
                          >
                            <Cancel />
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
              {applications.length === 0 
                ? "No applications received yet. Applications will appear here when students apply to your courses."
                : "No applications found matching your search criteria."}
            </Alert>
          )}
        </TabPanel>

        {/* Faculties Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Manage Faculties ({faculties.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setAddFacultyOpen(true)}
            >
              Add Faculty
            </Button>
          </Box>

          <Grid container spacing={3}>
            {faculties.map(faculty => (
              <Grid item xs={12} md={6} lg={4} key={faculty.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {faculty.name}
                      </Typography>
                      <Chip 
                        label={`${instituteCourses.filter(c => c.facultyId === faculty.id).length} courses`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {faculty.description || 'No description provided.'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Created: {formatDate(faculty.createdAt)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<Edit />}
                      onClick={() => editFaculty(faculty)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<School />}
                      onClick={() => viewFacultyCourses(faculty)}
                    >
                      View Courses ({instituteCourses.filter(c => c.facultyId === faculty.id).length})
                    </Button>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => deleteFaculty(faculty)}
                      sx={{ ml: 'auto' }}
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {faculties.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No faculties created yet. Add your first faculty to start organizing courses.
            </Alert>
          )}
        </TabPanel>

        {/* Courses Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Manage Courses ({instituteCourses.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setAddCourseOpen(true)}
            >
              Add Course
            </Button>
          </Box>

          <Grid container spacing={3}>
            {instituteCourses.map(course => {
              const faculty = faculties.find(f => f.id === course.facultyId);
              const courseApplications = applications.filter(a => a.courseId === course.id);
              
              return (
                <Grid item xs={12} md={6} lg={4} key={course.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {course.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {faculty?.name || 'No Faculty'}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {course.description || 'No description provided.'}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Requirements:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          <Chip label={`Min GPA: ${course.requirements?.minGPA || 'N/A'}`} size="small" />
                          {course.requirements?.entranceExam && (
                            <Chip label="Entrance Exam" size="small" color="primary" />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">
                          <strong>Duration:</strong> {course.duration || 'Not specified'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Seats:</strong> {course.seats || 'N/A'}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">
                        {courseApplications.length} applications
                      </Typography>
                      <Box>
                        <Button 
                          size="small" 
                          startIcon={<Edit />}
                          onClick={() => editCourse(course)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<People />}
                          onClick={() => viewCourseApplications(course)}
                        >
                          View Apps
                        </Button>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => deleteCourse(course)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {instituteCourses.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No courses created yet. Add courses to your faculties to attract students.
            </Alert>
          )}
        </TabPanel>

        {/* Students Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Admitted Students ({students.length})
          </Typography>
          
          {students.length > 0 ? (
            <Grid container spacing={3}>
              {students.map(student => (
                <Grid item xs={12} md={6} lg={4} key={student.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {student.studentName?.charAt(0) || 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{student.studentName || 'Unknown Student'}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {student.studentEmail || 'No email'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Course:</strong> {student.courseName || 'Unknown Course'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Admission Date:</strong> {formatDate(student.admittedAt)}
                      </Typography>
                      <Chip 
                        label="Admitted" 
                        color="success" 
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No students admitted yet. Admit students from the applications tab.
            </Alert>
          )}
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountCircle /> Institute Profile
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<Edit />}
                  onClick={() => setEditProfileOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Edit Profile
                </Button>
                
                <List sx={{ mt: 2 }}>
                  <ListItem>
                    <ListItemIcon><LocationOn color="primary" /></ListItemIcon>
                    <ListItemText primary="Location" secondary={profileData.location || 'Not specified'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Email color="primary" /></ListItemIcon>
                    <ListItemText primary="Contact Email" secondary={profileData.contactEmail || 'Not specified'} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Phone color="primary" /></ListItemIcon>
                    <ListItemText primary="Phone" secondary={profileData.phone || 'Not specified'} />
                  </ListItem>
                  {profileData.website && (
                    <ListItem>
                      <ListItemIcon><School color="primary" /></ListItemIcon>
                      <ListItemText primary="Website" secondary={profileData.website} />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Settings /> System Settings
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Automatic Application Processing" 
                      secondary="Automatically admit students who meet requirements" 
                    />
                    <Switch />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Email Notifications" 
                      secondary="Send email updates to students" 
                    />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Public Profile" 
                      secondary="Show institute in public directory" 
                    />
                    <Switch defaultChecked />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Enhanced Add Faculty Dialog */}
      <Dialog open={addFacultyOpen} onClose={() => setAddFacultyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Class /> Add New Faculty
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Faculty Name"
              value={facultyData.name}
              onChange={e => setFacultyData({...facultyData, name: e.target.value})}
              fullWidth
              margin="normal"
              required
              error={!facultyData.name.trim()}
              helperText={!facultyData.name.trim() ? "Faculty name is required" : "e.g., Faculty of Information Technology"}
              placeholder="e.g., Faculty of Information Technology"
            />
            <TextField
              label="Description"
              value={facultyData.description}
              onChange={e => setFacultyData({...facultyData, description: e.target.value})}
              fullWidth
              margin="normal"
              multiline
              rows={3}
              placeholder="Brief description of the faculty, departments, and focus areas..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFacultyOpen(false)}>Cancel</Button>
          <Button 
            onClick={addFaculty}
            variant="contained"
            disabled={!facultyData.name.trim() || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Add />}
          >
            {loading ? 'Adding...' : 'Add Faculty'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW: Edit Faculty Dialog */}
      <Dialog open={editFacultyOpen} onClose={() => setEditFacultyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Class /> Edit Faculty
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Faculty Name"
              value={facultyData.name}
              onChange={e => setFacultyData({...facultyData, name: e.target.value})}
              fullWidth
              margin="normal"
              required
              error={!facultyData.name.trim()}
              helperText={!facultyData.name.trim() ? "Faculty name is required" : ""}
            />
            <TextField
              label="Description"
              value={facultyData.description}
              onChange={e => setFacultyData({...facultyData, description: e.target.value})}
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFacultyOpen(false)}>Cancel</Button>
          <Button 
            onClick={updateFaculty}
            variant="contained"
            disabled={!facultyData.name.trim() || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Edit />}
          >
            {loading ? 'Updating...' : 'Update Faculty'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW: View Faculty Courses Dialog */}
      <Dialog open={viewCoursesOpen} onClose={() => setViewCoursesOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <School /> Courses in {selectedFaculty?.name}
            </Box>
            <IconButton onClick={() => setViewCoursesOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedFacultyCourses.length > 0 ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {selectedFacultyCourses.map(course => (
                <Grid item xs={12} key={course.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{course.name}</Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {course.description || 'No description provided.'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`Duration: ${course.duration || 'N/A'}`} size="small" />
                        <Chip label={`Seats: ${course.seats || 'N/A'}`} size="small" />
                        <Chip label={`Min GPA: ${course.requirements?.minGPA || 'N/A'}`} size="small" />
                        {course.requirements?.entranceExam && (
                          <Chip label="Entrance Exam" size="small" color="primary" />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<Edit />}
                        onClick={() => {
                          setViewCoursesOpen(false);
                          editCourse(course);
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<People />}
                        onClick={() => {
                          setViewCoursesOpen(false);
                          viewCourseApplications(course);
                        }}
                      >
                        View Applications ({applications.filter(app => app.courseId === course.id).length})
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No courses found in this faculty. Add courses to this faculty to get started.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewCoursesOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setViewCoursesOpen(false);
              setAddCourseOpen(true);
              setCourseData(prev => ({ ...prev, facultyId: selectedFaculty?.id || '' }));
            }}
          >
            Add Course to this Faculty
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Course Dialog */}
      <Dialog open={addCourseOpen} onClose={() => setAddCourseOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School /> Add New Course
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Select
                value={courseData.facultyId}
                onChange={e => setCourseData({...courseData, facultyId: e.target.value})}
                displayEmpty
                fullWidth
                required
              >
                <MenuItem value="">
                  <em>Select Faculty</em>
                </MenuItem>
                {faculties.map(faculty => (
                  <MenuItem key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Course Name"
                value={courseData.name}
                onChange={e => setCourseData({...courseData, name: e.target.value})}
                fullWidth
                required
                placeholder="e.g., BSc in Computer Science"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={courseData.description}
                onChange={e => setCourseData({...courseData, description: e.target.value})}
                fullWidth
                multiline
                rows={3}
                placeholder="Course description and overview..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration"
                value={courseData.duration}
                onChange={e => setCourseData({...courseData, duration: e.target.value})}
                fullWidth
                placeholder="e.g., 4 years"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fees"
                value={courseData.fees}
                onChange={e => setCourseData({...courseData, fees: e.target.value})}
                fullWidth
                placeholder="e.g., $10,000 per year"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Minimum GPA Requirement"
                type="number"
                value={courseData.requirements.minGPA}
                onChange={e => setCourseData({
                  ...courseData, 
                  requirements: { ...courseData.requirements, minGPA: parseFloat(e.target.value) || 0 }
                })}
                fullWidth
                inputProps={{ min: 0, max: 4, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Available Seats"
                type="number"
                value={courseData.seats}
                onChange={e => setCourseData({...courseData, seats: parseInt(e.target.value) || 0})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={courseData.requirements.entranceExam}
                    onChange={e => setCourseData({
                      ...courseData,
                      requirements: { ...courseData.requirements, entranceExam: e.target.checked }
                    })}
                  />
                }
                label="Requires Entrance Exam"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCourseOpen(false)}>Cancel</Button>
          <Button 
            onClick={addCourse}
            variant="contained"
            disabled={!courseData.facultyId || !courseData.name.trim()}
          >
            Add Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW: Edit Course Dialog */}
      <Dialog open={editCourseOpen} onClose={() => setEditCourseOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School /> Edit Course
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Select
                value={courseData.facultyId}
                onChange={e => setCourseData({...courseData, facultyId: e.target.value})}
                displayEmpty
                fullWidth
                required
              >
                <MenuItem value="">
                  <em>Select Faculty</em>
                </MenuItem>
                {faculties.map(faculty => (
                  <MenuItem key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Course Name"
                value={courseData.name}
                onChange={e => setCourseData({...courseData, name: e.target.value})}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={courseData.description}
                onChange={e => setCourseData({...courseData, description: e.target.value})}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration"
                value={courseData.duration}
                onChange={e => setCourseData({...courseData, duration: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fees"
                value={courseData.fees}
                onChange={e => setCourseData({...courseData, fees: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Minimum GPA Requirement"
                type="number"
                value={courseData.requirements.minGPA}
                onChange={e => setCourseData({
                  ...courseData, 
                  requirements: { ...courseData.requirements, minGPA: parseFloat(e.target.value) || 0 }
                })}
                fullWidth
                inputProps={{ min: 0, max: 4, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Available Seats"
                type="number"
                value={courseData.seats}
                onChange={e => setCourseData({...courseData, seats: parseInt(e.target.value) || 0})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={courseData.requirements.entranceExam}
                    onChange={e => setCourseData({
                      ...courseData,
                      requirements: { ...courseData.requirements, entranceExam: e.target.checked }
                    })}
                  />
                }
                label="Requires Entrance Exam"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCourseOpen(false)}>Cancel</Button>
          <Button 
            onClick={updateCourse}
            variant="contained"
            disabled={!courseData.facultyId || !courseData.name.trim()}
          >
            Update Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountCircle /> Edit Institute Profile
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Institute Name"
                value={profileData.name}
                onChange={e => setProfileData({...profileData, name: e.target.value})}
                fullWidth
                required
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
                label="Established Year"
                type="number"
                value={profileData.establishedYear}
                onChange={e => setProfileData({...profileData, establishedYear: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={profileData.description}
                onChange={e => setProfileData({...profileData, description: e.target.value})}
                fullWidth
                multiline
                rows={4}
                placeholder="Brief description of your institute..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileOpen(false)}>Cancel</Button>
          <Button 
            onClick={updateProfileHandler}
            variant="contained"
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog open={viewApplicationOpen} onClose={() => setViewApplicationOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Application Details
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>Student Information</Typography>
                <Typography><strong>Name:</strong> {selectedApplication.studentName}</Typography>
                <Typography><strong>Email:</strong> {selectedApplication.studentEmail}</Typography>
                <Typography><strong>GPA:</strong> {selectedApplication.studentGPA}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>Course Information</Typography>
                <Typography><strong>Course:</strong> {selectedApplication.courseName}</Typography>
                <Typography><strong>Faculty:</strong> {selectedApplication.facultyName}</Typography>
                <Typography><strong>Applied:</strong> {formatDate(selectedApplication.appliedAt)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Application Status</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip 
                    label={selectedApplication.status} 
                    color={getStatusColor(selectedApplication.status)}
                    size="medium"
                  />
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="success"
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'admitted')}
                  >
                    Admit
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="error"
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
          <Button onClick={() => setViewApplicationOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
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
    <InstituteDashboard />
  </SnackbarProvider>
);