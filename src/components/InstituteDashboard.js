// src/components/InstituteDashboard.js
import React, { useEffect, useState, useRef } from 'react';
import { 
  Container, Typography, Table, TableBody, TableCell, TableHead, 
  TableRow, Paper, Select, MenuItem, TextField, Button, Box, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, 
  LinearProgress, Chip, Card, CardContent, Avatar,
  Tabs, Tab, List, ListItem, ListItemText,
  Divider, Tooltip, Badge, Switch, FormControlLabel,
  Rating, CardActions, Collapse, InputAdornment,
  CircularProgress
} from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
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

// Professional color palette
const COLORS = {
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  mediumGray: '#E9ECEF',
  darkGray: '#6C757D',
  black: '#212529',
  primary: '#2E7D32', // Green
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8'
};

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
  const [filteredApplications, setFilteredApplications] = useState([]);
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
  
  // Edit states for faculties and courses
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

  // Firestore data fetching
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
      setFilteredApplications(applicationsData);
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

  // Function to view courses for a specific faculty
  const viewFacultyCourses = (faculty) => {
    setSelectedFaculty(faculty);
    const facultyCourses = courses.filter(course => course.facultyId === faculty.id);
    setSelectedFacultyCourses(facultyCourses);
    setViewCoursesOpen(true);
  };

  // Function to edit faculty
  const editFaculty = (faculty) => {
    setSelectedFaculty(faculty);
    setFacultyData({
      name: faculty.name || '',
      description: faculty.description || ''
    });
    setEditFacultyOpen(true);
  };

  // Function to update faculty
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
      
      await fetchFacultiesData();
      
    } catch (error) {
      console.error('Update faculty error:', error);
      enqueueSnackbar(`Failed to update faculty: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Function to delete faculty
  const deleteFaculty = async (faculty) => {
    if (!window.confirm(`Are you sure you want to delete "${faculty.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      
      const facultyCourses = courses.filter(course => course.facultyId === faculty.id);
      if (facultyCourses.length > 0) {
        enqueueSnackbar(`Cannot delete faculty. It has ${facultyCourses.length} course(s) associated. Please delete or reassign the courses first.`, { variant: 'error' });
        return;
      }

      const facultyRef = doc(db, 'faculties', faculty.id);
      await deleteDoc(facultyRef);

      enqueueSnackbar('Faculty deleted successfully!', { variant: 'success' });
      
      await fetchFacultiesData();
      
    } catch (error) {
      console.error('Delete faculty error:', error);
      enqueueSnackbar(`Failed to delete faculty: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Function to edit course
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

  // Function to update course
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
      
      await fetchCoursesData();
      
    } catch (error) {
      console.error('Update course error:', error);
      enqueueSnackbar('Failed to update course: ' + error.message, { variant: 'error' });
    }
  };

  // Function to delete course
  const deleteCourse = async (course) => {
    if (!window.confirm(`Are you sure you want to delete "${course.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      const courseApplications = applications.filter(app => app.courseId === course.id);
      if (courseApplications.length > 0) {
        enqueueSnackbar(`Cannot delete course. It has ${courseApplications.length} application(s) associated.`, { variant: 'error' });
        return;
      }

      const courseRef = doc(db, 'courses', course.id);
      await deleteDoc(courseRef);

      enqueueSnackbar('Course deleted successfully!', { variant: 'success' });
      
      await fetchCoursesData();
      
    } catch (error) {
      console.error('Delete course error:', error);
      enqueueSnackbar(`Failed to delete course: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Function to view course applications
  const viewCourseApplications = (course) => {
    setSelectedCourse(course);
    const courseApplications = applications.filter(app => app.courseId === course.id);
    setFilteredApplications(courseApplications);
    setTabValue(1);
    setSearchTerm(course.name);
    setStatusFilter('all');
    
    enqueueSnackbar(`Showing ${courseApplications.length} applications for ${course.name}`, { variant: 'info' });
  };

  // Function to handle when student rejects admission offer
  const handleStudentRejection = async (studentId) => {
    try {
      const studentRef = doc(db, 'applications', studentId);
      
      // Delete the application since student rejected the offer
      await deleteDoc(studentRef);
      
      enqueueSnackbar('Student application removed as student rejected the offer', { variant: 'success' });
      
      // Find the next eligible student from waitlist/pending for the same course
      const rejectedStudent = students.find(s => s.id === studentId);
      if (rejectedStudent) {
        const courseApplications = applications.filter(app => 
          app.courseId === rejectedStudent.courseId && 
          app.status === 'pending'
        );
        
        if (courseApplications.length > 0) {
          // Sort by GPA and application date to find the next best candidate
          const nextCandidate = courseApplications.sort((a, b) => {
            if (b.studentGPA !== a.studentGPA) {
              return b.studentGPA - a.studentGPA;
            }
            return new Date(a.appliedAt) - new Date(b.appliedAt);
          })[0];
          
          // Auto-admit the next candidate
          await updateApplicationStatus(nextCandidate.id, 'admitted');
          enqueueSnackbar(`Next candidate ${nextCandidate.studentName} automatically admitted from waitlist`, { variant: 'info' });
        }
      }
      
      // Refresh data
      await Promise.all([
        fetchApplicationsData(),
        fetchAdmittedStudents()
      ]);
      
    } catch (error) {
      console.error('Error handling student rejection:', error);
      enqueueSnackbar('Failed to process student rejection: ' + error.message, { variant: 'error' });
    }
  };

  // Update filtered applications when search term or status filter changes
  useEffect(() => {
    const filtered = applications.filter(application => {
      const matchesSearch = application.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           application.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

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

      await addDoc(collection(db, 'faculties'), facultyPayload);

      enqueueSnackbar('Faculty added successfully!', { variant: 'success' });
      setAddFacultyOpen(false);
      setFacultyData({ name: '', description: '' });
      
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
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4, backgroundColor: COLORS.lightGray, minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`, 
        color: COLORS.white 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 100, height: 100, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <Typography variant="h4" sx={{ color: COLORS.white }}>
                {profileData.name?.charAt(0) || 'I'}
              </Typography>
            </Avatar>
            <Box>
              <Typography variant="h3" gutterBottom fontWeight="bold">
                {profileData.name || 'Institution Name'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6">
                  {profileData.location || 'Location not specified'}
                </Typography>
                {profileData.establishedYear && (
                  <Typography variant="h6">
                    Est. {profileData.establishedYear}
                  </Typography>
                )}
                <Chip 
                  label="Institute Account" 
                  variant="outlined" 
                  sx={{ color: COLORS.white, borderColor: COLORS.white }}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <Button onClick={refreshData} sx={{ color: COLORS.white }}>
                Refresh
              </Button>
            </Tooltip>
            <Tooltip title="Edit Profile">
              <Button onClick={() => setEditProfileOpen(true)} sx={{ color: COLORS.white }}>
                Edit Profile
              </Button>
            </Tooltip>
            <Button variant="outlined" color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Connection Status */}
      <Alert severity="success" sx={{ mb: 3 }}>
        Firestore connected - {applications.length} applications loaded from {instituteCourses.length} courses
      </Alert>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            transition: 'transform 0.2s', 
            '&:hover': { transform: 'translateY(-4px)' },
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.mediumGray}`
          }}>
            <Typography variant="h4" sx={{ color: COLORS.primary, mb: 2 }}>Total</Typography>
            <Typography variant="h4" sx={{ color: COLORS.primary }} gutterBottom fontWeight="bold">
              {stats.totalApplications}
            </Typography>
            <Typography variant="h6" color={COLORS.darkGray}>Total Applications</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            transition: 'transform 0.2s', 
            '&:hover': { transform: 'translateY(-4px)' },
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.mediumGray}`
          }}>
            <Typography variant="h4" sx={{ color: COLORS.success, mb: 2 }}>Admitted</Typography>
            <Typography variant="h4" sx={{ color: COLORS.success }} gutterBottom fontWeight="bold">
              {stats.admitted}
            </Typography>
            <Typography variant="h6" color={COLORS.darkGray}>Admitted</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            transition: 'transform 0.2s', 
            '&:hover': { transform: 'translateY(-4px)' },
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.mediumGray}`
          }}>
            <Typography variant="h4" sx={{ color: COLORS.error, mb: 2 }}>Rejected</Typography>
            <Typography variant="h4" sx={{ color: COLORS.error }} gutterBottom fontWeight="bold">
              {stats.rejected}
            </Typography>
            <Typography variant="h6" color={COLORS.darkGray}>Rejected</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            transition: 'transform 0.2s', 
            '&:hover': { transform: 'translateY(-4px)' },
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.mediumGray}`
          }}>
            <Typography variant="h4" sx={{ color: COLORS.warning, mb: 2 }}>Pending</Typography>
            <Typography variant="h4" sx={{ color: COLORS.warning }} gutterBottom fontWeight="bold">
              {stats.pending}
            </Typography>
            <Typography variant="h6" color={COLORS.darkGray}>Pending</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            transition: 'transform 0.2s', 
            '&:hover': { transform: 'translateY(-4px)' },
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.mediumGray}`
          }}>
            <Typography variant="h4" sx={{ color: COLORS.primaryLight, mb: 2 }}>Rate</Typography>
            <Typography variant="h4" sx={{ color: COLORS.primaryLight }} gutterBottom fontWeight="bold">
              {stats.admissionRate}%
            </Typography>
            <Typography variant="h6" color={COLORS.darkGray}>Admission Rate</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content with Tabs */}
      <Paper sx={{ width: '100%', backgroundColor: COLORS.white }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: COLORS.mediumGray,
            '& .MuiTab-root': {
              color: COLORS.darkGray,
              '&.Mui-selected': {
                color: COLORS.primary,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: COLORS.primary,
            },
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Dashboard" />
          <Tab label={`Applications (${applications.length})`} />
          <Tab label={`Faculties (${faculties.length})`} />
          <Tab label={`Courses (${instituteCourses.length})`} />
          <Tab label="Students" />
          <Tab label="Settings" />
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3, backgroundColor: COLORS.white, border: `1px solid ${COLORS.mediumGray}` }}>
                <Typography variant="h5" gutterBottom color={COLORS.black}>
                  Application Analytics
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: COLORS.lightGray }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom color={COLORS.black}>
                      Application Overview
                    </Typography>
                    <Typography variant="body1" color={COLORS.darkGray} gutterBottom>
                      Total Applications: <strong>{stats.totalApplications}</strong>
                    </Typography>
                    <Typography variant="body1" color={COLORS.darkGray} gutterBottom>
                      Admitted Students: <strong>{stats.admitted}</strong>
                    </Typography>
                    <Typography variant="body1" color={COLORS.darkGray}>
                      Admission Rate: <strong>{stats.admissionRate}%</strong>
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, backgroundColor: COLORS.white, border: `1px solid ${COLORS.mediumGray}` }}>
                <Typography variant="h5" gutterBottom color={COLORS.black}>
                  Quick Actions
                </Typography>
                <List>
                  <ListItem button onClick={() => setAddCourseOpen(true)}>
                    <ListItemText 
                      primary="Add New Course" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary="Create a new course offering"
                      secondaryTypographyProps={{ color: COLORS.darkGray }}
                    />
                  </ListItem>
                  <ListItem button onClick={() => setAddFacultyOpen(true)}>
                    <ListItemText 
                      primary="Add New Faculty" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary="Create a new faculty department"
                      secondaryTypographyProps={{ color: COLORS.darkGray }}
                    />
                  </ListItem>
                  <ListItem button onClick={publishAdmissions}>
                    <ListItemText 
                      primary="Publish Admissions" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary="Make admission results public"
                      secondaryTypographyProps={{ color: COLORS.darkGray }}
                    />
                  </ListItem>
                  <ListItem button onClick={exportApplications}>
                    <ListItemText 
                      primary="Export Data" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary="Download applications as CSV"
                      secondaryTypographyProps={{ color: COLORS.darkGray }}
                    />
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
              onClick={exportApplications}
              variant="outlined"
              disabled={applications.length === 0}
              sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              Export
            </Button>
            <Button 
              onClick={refreshData}
              variant="outlined"
              sx={{ borderColor: COLORS.darkGray, color: COLORS.darkGray }}
            >
              Refresh
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography color={COLORS.darkGray}>
              Showing {filteredApplications.length} of {applications.length} applications
            </Typography>
          </Box>

          {filteredApplications.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><Typography color={COLORS.black} fontWeight="bold">Student</Typography></TableCell>
                  <TableCell><Typography color={COLORS.black} fontWeight="bold">Course & Faculty</Typography></TableCell>
                  <TableCell><Typography color={COLORS.black} fontWeight="bold">Academic Info</Typography></TableCell>
                  <TableCell><Typography color={COLORS.black} fontWeight="bold">Applied Date</Typography></TableCell>
                  <TableCell><Typography color={COLORS.black} fontWeight="bold">Status</Typography></TableCell>
                  <TableCell><Typography color={COLORS.black} fontWeight="bold">Actions</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map(application => (
                  <TableRow key={application.id} hover sx={{ '&:hover': { backgroundColor: COLORS.lightGray } }}>
                    <TableCell>
                      <Box>
                        <Typography fontWeight="bold" color={COLORS.black}>{application.studentName || 'Unknown Student'}</Typography>
                        <Typography variant="body2" color={COLORS.darkGray}>
                          {application.studentEmail || 'No email'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium" color={COLORS.black}>{application.courseName || 'Unknown Course'}</Typography>
                      <Typography variant="body2" color={COLORS.darkGray}>
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
                        <Button 
                          size="small" 
                          onClick={() => viewApplicationDetails(application)}
                          sx={{ color: COLORS.primary }}
                        >
                          View
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => updateApplicationStatus(application.id, 'admitted')}
                          sx={{ color: COLORS.success }}
                        >
                          Admit
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          sx={{ color: COLORS.error }}
                        >
                          Reject
                        </Button>
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
            <Typography variant="h6" color={COLORS.black}>
              Manage Faculties ({faculties.length})
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setAddFacultyOpen(true)}
              sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
            >
              Add Faculty
            </Button>
          </Box>

          <Grid container spacing={3}>
            {faculties.map(faculty => (
              <Grid item xs={12} md={6} lg={4} key={faculty.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.mediumGray}`
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" gutterBottom color={COLORS.black}>
                        {faculty.name}
                      </Typography>
                      <Chip 
                        label={`${instituteCourses.filter(c => c.facultyId === faculty.id).length} courses`}
                        size="small"
                        sx={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                      />
                    </Box>
                    <Typography variant="body2" color={COLORS.darkGray} paragraph>
                      {faculty.description || 'No description provided.'}
                    </Typography>
                    <Typography variant="caption" color={COLORS.darkGray}>
                      Created: {formatDate(faculty.createdAt)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => editFaculty(faculty)}
                      sx={{ color: COLORS.primary }}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      onClick={() => viewFacultyCourses(faculty)}
                      sx={{ color: COLORS.primaryLight }}
                    >
                      View Courses ({instituteCourses.filter(c => c.facultyId === faculty.id).length})
                    </Button>
                    <Button 
                      size="small" 
                      sx={{ color: COLORS.error, ml: 'auto' }}
                      onClick={() => deleteFaculty(faculty)}
                    >
                      Delete
                    </Button>
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
            <Typography variant="h6" color={COLORS.black}>
              Manage Courses ({instituteCourses.length})
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setAddCourseOpen(true)}
              sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
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
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.mediumGray}`
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom color={COLORS.black}>
                        {course.name}
                      </Typography>
                      <Typography variant="body2" color={COLORS.darkGray} gutterBottom>
                        {faculty?.name || 'No Faculty'}
                      </Typography>
                      <Typography variant="body2" paragraph color={COLORS.black}>
                        {course.description || 'No description provided.'}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color={COLORS.darkGray}>
                          Requirements:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {course.requirements?.minGPA && (
                            <Chip label={`Min GPA: ${course.requirements.minGPA}`} size="small" variant="outlined" />
                          )}
                          {course.requirements?.entranceExam && (
                            <Chip label="Entrance Exam" size="small" sx={{ backgroundColor: COLORS.primary, color: COLORS.white }} />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color={COLORS.black}>
                          <strong>Duration:</strong> {course.duration || 'Not specified'}
                        </Typography>
                        <Typography variant="body2" color={COLORS.black}>
                          <strong>Seats:</strong> {course.seats || 'N/A'}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" color={COLORS.darkGray}>
                        {courseApplications.length} applications
                      </Typography>
                      <Box>
                        <Button 
                          size="small" 
                          onClick={() => editCourse(course)}
                          sx={{ color: COLORS.primary }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => viewCourseApplications(course)}
                          sx={{ color: COLORS.primaryLight }}
                        >
                          View Apps
                        </Button>
                        <Button 
                          size="small" 
                          sx={{ color: COLORS.error }}
                          onClick={() => deleteCourse(course)}
                        >
                          Delete
                        </Button>
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
          <Typography variant="h6" gutterBottom color={COLORS.black}>
            Admitted Students ({students.length})
          </Typography>
          
          {students.length > 0 ? (
            <Grid container spacing={3}>
              {students.map(student => (
                <Grid item xs={12} md={6} lg={4} key={student.id}>
                  <Card sx={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.mediumGray}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: COLORS.primary }}>
                          {student.studentName?.charAt(0) || 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" color={COLORS.black}>{student.studentName || 'Unknown Student'}</Typography>
                          <Typography variant="body2" color={COLORS.darkGray}>
                            {student.studentEmail || 'No email'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" gutterBottom color={COLORS.black}>
                        <strong>Course:</strong> {student.courseName || 'Unknown Course'}
                      </Typography>
                      <Typography variant="body2" gutterBottom color={COLORS.black}>
                        <strong>Faculty:</strong> {student.facultyName || 'Unknown Faculty'}
                      </Typography>
                      <Typography variant="body2" gutterBottom color={COLORS.black}>
                        <strong>Admission Date:</strong> {formatDate(student.admittedAt)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Chip 
                          label="Admitted" 
                          sx={{ backgroundColor: COLORS.success, color: COLORS.white }}
                          size="small"
                        />
                        <Button 
                          size="small" 
                          sx={{ color: COLORS.error }}
                          variant="outlined"
                          onClick={() => handleStudentRejection(student.id)}
                        >
                          Student Rejected Offer
                        </Button>
                      </Box>
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
              <Paper sx={{ p: 3, backgroundColor: COLORS.white, border: `1px solid ${COLORS.mediumGray}` }}>
                <Typography variant="h6" gutterBottom color={COLORS.black}>
                  Institute Profile
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setEditProfileOpen(true)}
                  sx={{ mt: 1, borderColor: COLORS.primary, color: COLORS.primary }}
                >
                  Edit Profile
                </Button>
                
                <List sx={{ mt: 2 }}>
                  <ListItem>
                    <ListItemText 
                      primary="Location" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary={profileData.location || 'Not specified'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Contact Email" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary={profileData.contactEmail || 'Not specified'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Phone" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary={profileData.phone || 'Not specified'} 
                    />
                  </ListItem>
                  {profileData.website && (
                    <ListItem>
                      <ListItemText 
                        primary="Website" 
                        primaryTypographyProps={{ color: COLORS.black }}
                        secondary={profileData.website} 
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, backgroundColor: COLORS.white, border: `1px solid ${COLORS.mediumGray}` }}>
                <Typography variant="h6" gutterBottom color={COLORS.black}>
                  System Settings
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Automatic Application Processing" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary="Automatically admit students who meet requirements" 
                      secondaryTypographyProps={{ color: COLORS.darkGray }}
                    />
                    <Switch />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Email Notifications" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary="Send email updates to students" 
                      secondaryTypographyProps={{ color: COLORS.darkGray }}
                    />
                    <Switch defaultChecked />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Public Profile" 
                      primaryTypographyProps={{ color: COLORS.black }}
                      secondary="Show institute in public directory" 
                      secondaryTypographyProps={{ color: COLORS.darkGray }}
                    />
                    <Switch defaultChecked />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Add Faculty Dialog */}
      <Dialog open={addFacultyOpen} onClose={() => setAddFacultyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Add New Faculty</Typography>
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
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            {loading ? 'Adding...' : 'Add Faculty'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Faculty Dialog */}
      <Dialog open={editFacultyOpen} onClose={() => setEditFacultyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Edit Faculty</Typography>
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
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            {loading ? 'Updating...' : 'Update Faculty'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Faculty Courses Dialog */}
      <Dialog open={viewCoursesOpen} onClose={() => setViewCoursesOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
            <Typography variant="h6" color={COLORS.black}>
              Courses in {selectedFaculty?.name}
            </Typography>
            <Button onClick={() => setViewCoursesOpen(false)}>
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedFacultyCourses.length > 0 ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {selectedFacultyCourses.map(course => (
                <Grid item xs={12} key={course.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color={COLORS.black}>{course.name}</Typography>
                      <Typography variant="body2" color={COLORS.darkGray} paragraph>
                        {course.description || 'No description provided.'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`Duration: ${course.duration || 'N/A'}`} size="small" />
                        <Chip label={`Seats: ${course.seats || 'N/A'}`} size="small" />
                        <Chip label={`Min GPA: ${course.requirements?.minGPA || 'N/A'}`} size="small" />
                        {course.requirements?.entranceExam && (
                          <Chip label="Entrance Exam" size="small" sx={{ backgroundColor: COLORS.primary, color: COLORS.white }} />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => {
                          setViewCoursesOpen(false);
                          editCourse(course);
                        }}
                        sx={{ color: COLORS.primary }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        onClick={() => {
                          setViewCoursesOpen(false);
                          viewCourseApplications(course);
                        }}
                        sx={{ color: COLORS.primaryLight }}
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
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            Add Course to this Faculty
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Course Dialog */}
      <Dialog open={addCourseOpen} onClose={() => setAddCourseOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Add New Course</Typography>
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
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            Add Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editCourseOpen} onClose={() => setEditCourseOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Edit Course</Typography>
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
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            Update Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Edit Institute Profile</Typography>
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
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog open={viewApplicationOpen} onClose={() => setViewApplicationOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Application Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom color={COLORS.black}>Student Information</Typography>
                <Typography color={COLORS.black}><strong>Name:</strong> {selectedApplication.studentName}</Typography>
                <Typography color={COLORS.black}><strong>Email:</strong> {selectedApplication.studentEmail}</Typography>
                <Typography color={COLORS.black}><strong>GPA:</strong> {selectedApplication.studentGPA}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom color={COLORS.black}>Course Information</Typography>
                <Typography color={COLORS.black}><strong>Course:</strong> {selectedApplication.courseName}</Typography>
                <Typography color={COLORS.black}><strong>Faculty:</strong> {selectedApplication.facultyName}</Typography>
                <Typography color={COLORS.black}><strong>Applied:</strong> {formatDate(selectedApplication.appliedAt)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color={COLORS.black}>Application Status</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip 
                    label={selectedApplication.status} 
                    color={getStatusColor(selectedApplication.status)}
                    size="medium"
                  />
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ color: COLORS.success }}
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'admitted')}
                  >
                    Admit
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ color: COLORS.error }}
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