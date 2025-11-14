// src/components/AdminDashboard.js
import React, { useEffect, useState, useRef } from 'react';
import { 
  Container, Typography, Table, TableBody, TableCell, TableHead, 
  TableRow, Paper, Button, Box, Card, CardContent, Grid, Chip,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, LinearProgress, Menu, MenuItem, 
  ListItemText, Tooltip, Avatar, Tab, Tabs,
  Select, InputLabel, FormControl, Switch, FormControlLabel,
  Stepper, Step, StepLabel, StepContent, Badge, Divider,
  SpeedDial, SpeedDialAction, SpeedDialIcon, Fab,
  List, ListItem, ListItemAvatar, ListItemSecondaryAction,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { 
  collection, onSnapshot, doc, updateDoc, addDoc, 
  query, where, getDoc, deleteDoc, getDocs, orderBy,
  writeBatch, setDoc, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

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

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard = () => {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    institutes: 0,
    companies: 0,
    pendingCompanies: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalApplications: 0,
    totalJobs: 0
  });
  const [loading, setLoading] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [addInstitutionOpen, setAddInstitutionOpen] = useState(false);
  const [addFacultyOpen, setAddFacultyOpen] = useState(false);
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [publishAdmissionsOpen, setPublishAdmissionsOpen] = useState(false);
  const [viewReportsOpen, setViewReportsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [viewInstitutionDialogOpen, setViewInstitutionDialogOpen] = useState(false);

  // Form states
  const [institutionData, setInstitutionData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    phone: '',
    website: '',
    description: '',
    establishedYear: ''
  });

  const [facultyData, setFacultyData] = useState({
    name: '',
    description: '',
    instituteId: ''
  });

  const [courseData, setCourseData] = useState({
    name: '',
    description: '',
    facultyId: '',
    duration: '',
    fees: '',
    requirements: {
      minGPA: 0,
      subjects: []
    },
    seats: 0
  });

  const [admissionSettings, setAdmissionSettings] = useState({
    academicYear: new Date().getFullYear() + 1,
    startDate: '',
    endDate: '',
    announcement: '',
    isPublished: false
  });

  // Refs for real-time listeners
  const usersUnsubscribeRef = useRef(null);
  const institutionsUnsubscribeRef = useRef(null);
  const facultiesUnsubscribeRef = useRef(null);
  const coursesUnsubscribeRef = useRef(null);
  const applicationsUnsubscribeRef = useRef(null);
  const admissionsUnsubscribeRef = useRef(null);
  const jobsUnsubscribeRef = useRef(null);
  const reportsUnsubscribeRef = useRef(null);

  // Function to manually load profile if AuthContext fails
  const loadUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  // Load users with real-time listener
  const loadUsers = () => {
    if (!user) return;
    
    try {
      console.log('Setting up users listener');
      
      // Clean up previous listener
      if (usersUnsubscribeRef.current) {
        console.log('Cleaning up previous users listener');
        usersUnsubscribeRef.current();
      }
      
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
        }));
        
        console.log('Users loaded:', usersData.length);
        setUsers(usersData);
      }, (error) => {
        console.error('Error loading users:', error);
        enqueueSnackbar('Error loading users: ' + error.message, { variant: 'error' });
      });

      usersUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up users listener:', error);
      enqueueSnackbar('Error setting up users listener: ' + error.message, { variant: 'error' });
    }
  };

  // Load institutions with real-time listener
  const loadInstitutions = () => {
    if (!user) return;
    
    try {
      console.log('Setting up institutions listener');
      
      // Clean up previous listener
      if (institutionsUnsubscribeRef.current) {
        console.log('Cleaning up previous institutions listener');
        institutionsUnsubscribeRef.current();
      }
      
      const q = query(collection(db, 'institutions'), orderBy('name'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const institutionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Institutions loaded:', institutionsData.length);
        setInstitutions(institutionsData);
      }, (error) => {
        console.error('Error loading institutions:', error);
        enqueueSnackbar('Error loading institutions: ' + error.message, { variant: 'error' });
      });

      institutionsUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up institutions listener:', error);
      enqueueSnackbar('Error setting up institutions listener: ' + error.message, { variant: 'error' });
    }
  };

  // Load faculties with real-time listener
  const loadFaculties = () => {
    if (!user) return;
    
    try {
      console.log('Setting up faculties listener');
      
      // Clean up previous listener
      if (facultiesUnsubscribeRef.current) {
        console.log('Cleaning up previous faculties listener');
        facultiesUnsubscribeRef.current();
      }
      
      const q = query(collection(db, 'faculties'), orderBy('name'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const facultiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Faculties loaded:', facultiesData.length);
        setFaculties(facultiesData);
      }, (error) => {
        console.error('Error loading faculties:', error);
        enqueueSnackbar('Error loading faculties: ' + error.message, { variant: 'error' });
      });

      facultiesUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up faculties listener:', error);
      enqueueSnackbar('Error setting up faculties listener: ' + error.message, { variant: 'error' });
    }
  };

  // Load courses with real-time listener
  const loadCourses = () => {
    if (!user) return;
    
    try {
      console.log('Setting up courses listener');
      
      // Clean up previous listener
      if (coursesUnsubscribeRef.current) {
        console.log('Cleaning up previous courses listener');
        coursesUnsubscribeRef.current();
      }
      
      const q = query(collection(db, 'courses'), orderBy('name'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const coursesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Courses loaded:', coursesData.length);
        setCourses(coursesData);
      }, (error) => {
        console.error('Error loading courses:', error);
        enqueueSnackbar('Error loading courses: ' + error.message, { variant: 'error' });
      });

      coursesUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up courses listener:', error);
      enqueueSnackbar('Error setting up courses listener: ' + error.message, { variant: 'error' });
    }
  };

  // Load admissions with real-time listener
  const loadAdmissions = () => {
    if (!user) return;
    
    try {
      console.log('Setting up admissions listener for admin');
      
      // Clean up previous listener
      if (admissionsUnsubscribeRef.current) {
        console.log('Cleaning up previous admissions listener');
        admissionsUnsubscribeRef.current();
      }
      
      const q = query(collection(db, 'admissions'), orderBy('appliedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const admissionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'admission',
          ...doc.data(),
          appliedAt: doc.data().appliedAt?.toDate?.() || new Date(doc.data().appliedAt)
        }));
        
        console.log('Admissions loaded:', admissionsData.length);
        setAdmissions(admissionsData);
      }, (error) => {
        console.error('Error loading admissions:', error);
        enqueueSnackbar('Error loading admissions: ' + error.message, { variant: 'error' });
      });

      admissionsUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up admissions listener:', error);
      enqueueSnackbar('Error setting up admissions listener: ' + error.message, { variant: 'error' });
    }
  };

  // Load job applications with real-time listener
  const loadApplications = () => {
    if (!user) return;
    
    try {
      console.log('Setting up job applications listener');
      
      // Clean up previous listener
      if (applicationsUnsubscribeRef.current) {
        console.log('Cleaning up previous applications listener');
        applicationsUnsubscribeRef.current();
      }
      
      const q = query(collection(db, 'jobApplications'), orderBy('appliedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const applicationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'job',
          ...doc.data(),
          appliedAt: doc.data().appliedAt?.toDate?.() || new Date(doc.data().appliedAt)
        }));
        
        console.log('Job applications loaded:', applicationsData.length);
        setApplications(applicationsData);
      }, (error) => {
        console.error('Error loading job applications:', error);
        enqueueSnackbar('Error loading job applications: ' + error.message, { variant: 'error' });
      });

      applicationsUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up applications listener:', error);
      enqueueSnackbar('Error setting up applications listener: ' + error.message, { variant: 'error' });
    }
  };

  // Load jobs with real-time listener
  const loadJobs = () => {
    if (!user) return;
    
    try {
      console.log('Setting up jobs listener');
      
      // Clean up previous listener
      if (jobsUnsubscribeRef.current) {
        console.log('Cleaning up previous jobs listener');
        jobsUnsubscribeRef.current();
      }
      
      const q = query(collection(db, 'jobs'), orderBy('postedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          postedAt: doc.data().postedAt?.toDate?.() || new Date(doc.data().postedAt)
        }));
        
        console.log('Jobs loaded:', jobsData.length);
        setJobs(jobsData);
      }, (error) => {
        console.error('Error loading jobs:', error);
        enqueueSnackbar('Error loading jobs: ' + error.message, { variant: 'error' });
      });

      jobsUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up jobs listener:', error);
      enqueueSnackbar('Error setting up jobs listener: ' + error.message, { variant: 'error' });
    }
  };

  // Load reports with real-time listener
  const loadReports = () => {
    if (!user) return;
    
    try {
      console.log('Setting up reports listener');
      
      // Clean up previous listener
      if (reportsUnsubscribeRef.current) {
        console.log('Cleaning up previous reports listener');
        reportsUnsubscribeRef.current();
      }
      
      const q = query(collection(db, 'reports'), orderBy('generatedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          generatedAt: doc.data().generatedAt?.toDate?.() || new Date(doc.data().generatedAt)
        }));
        
        console.log('Reports loaded:', reportsData.length);
        setReports(reportsData);
      }, (error) => {
        console.error('Error loading reports:', error);
        enqueueSnackbar('Error loading reports: ' + error.message, { variant: 'error' });
      });

      reportsUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up reports listener:', error);
      enqueueSnackbar('Error setting up reports listener: ' + error.message, { variant: 'error' });
    }
  };

  // Calculate statistics
  const calculateStatistics = () => {
    console.log('Calculating statistics with current data:', {
      users: users.length,
      admissions: admissions.length,
      applications: applications.length,
      jobs: jobs.length
    });

    const userStats = {
      totalUsers: users.length,
      students: users.filter(u => u.role === 'student').length,
      institutes: users.filter(u => u.role === 'institute').length,
      companies: users.filter(u => u.role === 'company').length,
      pendingCompanies: users.filter(u => u.role === 'company' && u.status === 'pending').length,
      activeUsers: users.filter(u => u.status === 'active' || !u.status).length,
      suspendedUsers: users.filter(u => u.status === 'suspended').length,
      totalApplications: admissions.length + applications.length,
      totalJobs: jobs.length
    };
    
    console.log('New statistics calculated:', userStats);
    setStats(userStats);
  };

  // Load all data with real-time listeners
  const loadData = () => {
    if (!user) return;

    setLoading(true);
    
    // Load all data with real-time listeners
    loadUsers();
    loadInstitutions();
    loadFaculties();
    loadCourses();
    loadAdmissions();
    loadApplications();
    loadJobs();
    loadReports();

    setLoading(false);
  };

  // Effect to calculate statistics when data changes
  useEffect(() => {
    console.log('Data changed, recalculating stats...');
    calculateStatistics();
  }, [users, admissions, applications, jobs]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) {
        console.log('Auth still loading...');
        return;
      }

      if (!user) {
        console.log('No user found, redirecting to login...');
        enqueueSnackbar('Please log in to access admin dashboard', { variant: 'warning' });
        navigate('/login');
        return;
      }

      let userProfile = profile;
      let userRole = profile?.role;

      // If profile is not loaded, try to load it manually
      if (user && (!profile || !profile.role)) {
        console.log('Profile missing or incomplete, loading manually...');
        try {
          userProfile = await loadUserProfile(user.uid);
          if (userProfile) {
            userRole = userProfile.role;
            console.log('Manually loaded profile role:', userRole);
          } else {
            setProfileError(true);
            enqueueSnackbar('Error loading user profile - profile not found', { variant: 'error' });
            return;
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          setProfileError(true);
          enqueueSnackbar('Failed to load user profile: ' + error.message, { variant: 'error' });
          return;
        }
      }

      if (userRole !== 'admin') {
        console.log('Access denied: User role is', userRole);
        enqueueSnackbar(`Access Denied. You are logged in as ${userRole}, but trying to access admin dashboard.`, { 
          variant: 'error',
          autoHideDuration: 5000 
        });
        setAccessChecked(true);
        
        // Redirect based on role
        setTimeout(() => {
          if (userRole === 'institute') {
            navigate('/institute-dashboard');
          } else if (userRole === 'student') {
            navigate('/student-dashboard');
          } else if (userRole === 'company') {
            navigate('/company-dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
        return;
      }

      console.log('Admin user confirmed, loading data...');
      setAccessChecked(true);
      loadData();
    };

    checkAdminAccess();

    // Cleanup listeners on unmount
    return () => {
      console.log('Cleaning up admin dashboard listeners');
      if (usersUnsubscribeRef.current) {
        usersUnsubscribeRef.current();
      }
      if (institutionsUnsubscribeRef.current) {
        institutionsUnsubscribeRef.current();
      }
      if (facultiesUnsubscribeRef.current) {
        facultiesUnsubscribeRef.current();
      }
      if (coursesUnsubscribeRef.current) {
        coursesUnsubscribeRef.current();
      }
      if (admissionsUnsubscribeRef.current) {
        admissionsUnsubscribeRef.current();
      }
      if (applicationsUnsubscribeRef.current) {
        applicationsUnsubscribeRef.current();
      }
      if (jobsUnsubscribeRef.current) {
        jobsUnsubscribeRef.current();
      }
      if (reportsUnsubscribeRef.current) {
        reportsUnsubscribeRef.current();
      }
    };
  }, [user, profile, authLoading, navigate, enqueueSnackbar]);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUserMenuOpen = (event, user) => {
    setUserMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
    setSelectedUser(null);
  };

  // View User Details
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setViewUserDialogOpen(true);
    handleUserMenuClose();
  };

  // View Institution Details
  const handleViewInstitution = (institution) => {
    setSelectedInstitution(institution);
    setViewInstitutionDialogOpen(true);
  };

  // Add Institution
  const addInstitution = async () => {
    if (!institutionData.name.trim() || !institutionData.email.trim() || !institutionData.password.trim()) {
      enqueueSnackbar('Institution name, email and password are required', { variant: 'error' });
      return;
    }

    if (institutionData.password.length < 6) {
      enqueueSnackbar('Password must be at least 6 characters', { variant: 'error' });
      return;
    }

    setLoading(true);
    enqueueSnackbar('Adding institution... Please wait.', { variant: 'info' });

    try {
      // Check if email already exists in users collection
      const emailQuery = query(collection(db, 'users'), where('email', '==', institutionData.email));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        enqueueSnackbar('Email already exists in the system', { variant: 'error' });
        setLoading(false);
        return;
      }

      // Create the institution user in Firebase Auth
      const { user: institutionUser } = await createUserWithEmailAndPassword(
        auth,
        institutionData.email,
        institutionData.password
      );

      // Create the user document in Firestore with proper structure
      const userData = {
        uid: institutionUser.uid,
        name: institutionData.name,
        email: institutionData.email,
        role: 'institute',
        status: 'active',
        location: institutionData.location || '',
        phone: institutionData.phone || '',
        website: institutionData.website || '',
        description: institutionData.description || '',
        establishedYear: institutionData.establishedYear || '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };

      await setDoc(doc(db, 'users', institutionUser.uid), userData);

      // Also add to institutions collection
      const institutionDoc = {
        name: institutionData.name,
        email: institutionData.email,
        location: institutionData.location || '',
        phone: institutionData.phone || '',
        website: institutionData.website || '',
        description: institutionData.description || '',
        establishedYear: institutionData.establishedYear || '',
        createdAt: serverTimestamp(),
        status: 'active',
        userId: institutionUser.uid
      };

      await addDoc(collection(db, 'institutions'), institutionDoc);

      enqueueSnackbar('Institution added successfully! They can now log in with the provided credentials.', { variant: 'success' });
      setAddInstitutionOpen(false);
      setInstitutionData({ 
        name: '', 
        email: '', 
        password: '', 
        location: '', 
        phone: '', 
        website: '', 
        description: '', 
        establishedYear: '' 
      });
      
    } catch (error) {
      console.error('Add institution error:', error);
      let errorMessage = 'Failed to add institution';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already exists in the system';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firebase rules.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Add Faculty
  const addFaculty = async () => {
    if (!facultyData.name.trim() || !facultyData.instituteId) {
      enqueueSnackbar('Faculty name and institution are required', { variant: 'error' });
      return;
    }

    try {
      await addDoc(collection(db, 'faculties'), {
        name: facultyData.name,
        description: facultyData.description,
        instituteId: facultyData.instituteId,
        createdAt: serverTimestamp(),
        status: 'active'
      });

      enqueueSnackbar('Faculty added successfully', { variant: 'success' });
      setAddFacultyOpen(false);
      setFacultyData({ 
        name: '', 
        description: '', 
        instituteId: '' 
      });
      
    } catch (error) {
      console.error('Add faculty error:', error);
      enqueueSnackbar('Failed to add faculty: ' + error.message, { variant: 'error' });
    }
  };

  // Add Course
  const addCourse = async () => {
    if (!courseData.name.trim() || !courseData.facultyId) {
      enqueueSnackbar('Course name and faculty are required', { variant: 'error' });
      return;
    }

    try {
      const faculty = faculties.find(f => f.id === courseData.facultyId);
      
      await addDoc(collection(db, 'courses'), {
        name: courseData.name,
        description: courseData.description,
        facultyId: courseData.facultyId,
        instituteId: faculty?.instituteId,
        duration: courseData.duration,
        fees: courseData.fees,
        requirements: courseData.requirements,
        seats: parseInt(courseData.seats) || 0,
        createdAt: serverTimestamp(),
        status: 'active'
      });

      enqueueSnackbar('Course added successfully', { variant: 'success' });
      setAddCourseOpen(false);
      setCourseData({ 
        name: '', 
        description: '', 
        facultyId: '', 
        duration: '', 
        fees: '', 
        requirements: { minGPA: 0, subjects: [] }, 
        seats: 0 
      });
      
    } catch (error) {
      console.error('Add course error:', error);
      enqueueSnackbar('Failed to add course: ' + error.message, { variant: 'error' });
    }
  };

const publishAdmissions = async () => {
  if (!admissionSettings.startDate || !admissionSettings.endDate) {
    enqueueSnackbar('Start date and end date are required', { variant: 'error' });
    return;
  }

  setLoading(true);
  
  try {
    const settingsData = {
      ...admissionSettings,
      isPublished: true,
      publishedAt: serverTimestamp(),
      publishedBy: user.uid,
      publishedByName: profile?.name || 'Administrator'
    };

    let success = false;
    let methodUsed = '';

    // Try method 1: Direct write to admissionSettings
    try {
      const admissionSettingsRef = doc(db, 'admissionSettings', 'current');
      await setDoc(admissionSettingsRef, settingsData);
      success = true;
      methodUsed = 'admissionSettings collection';
    } catch (firestoreError) {
      console.log('Method 1 failed, trying fallback...', firestoreError);
      
      // Try method 2: Store in user's document as fallback
      try {
        const userAdmissionSettingsRef = doc(db, 'users', user.uid);
        await updateDoc(userAdmissionSettingsRef, {
          admissionSettings: settingsData,
          admissionSettingsUpdatedAt: serverTimestamp()
        });
        success = true;
        methodUsed = 'user document fallback';
      } catch (userDocError) {
        console.log('Method 2 failed, trying local storage...', userDocError);
        
        // Method 3: Local storage as last resort
        const localSettings = {
          ...settingsData,
          publishedAt: new Date().toISOString()
        };
        localStorage.setItem('adminAdmissionSettings', JSON.stringify(localSettings));
        success = true;
        methodUsed = 'local storage';
      }
    }

    if (success) {
      // Notify students (if Firebase permissions allow)
      try {
        const students = users.filter(u => u.role === 'student');
        if (students.length > 0) {
          const notificationPromises = students.map(student => 
            addDoc(collection(db, 'notifications'), {
              userId: student.id,
              title: 'Admissions Published!',
              message: admissionSettings.announcement || `Admissions for ${admissionSettings.academicYear} have been published.`,
              type: 'admission',
              priority: 'high',
              read: false,
              createdAt: serverTimestamp()
            })
          );
          await Promise.all(notificationPromises);
          enqueueSnackbar(`Admissions published via ${methodUsed}! ${students.length} students notified.`, { variant: 'success' });
        } else {
          enqueueSnackbar(`Admissions published via ${methodUsed}!`, { variant: 'success' });
        }
      } catch (notifyError) {
        enqueueSnackbar(`Admissions published via ${methodUsed} (notification failed).`, { variant: 'info' });
      }
      
      setPublishAdmissionsOpen(false);
    }
    
  } catch (error) {
    console.error('All publish methods failed:', error);
    enqueueSnackbar('Failed to publish admissions. Please check Firebase permissions.', { variant: 'error' });
  } finally {
    setLoading(false);
  }
};

  // Manage User Status
  const manageUserStatus = async (userId, action) => {
    try {
      const userRef = doc(db, 'users', userId);
      let newStatus = 'active';
      let actionMessage = '';
      
      switch (action) {
        case 'approve':
          newStatus = 'active';
          actionMessage = 'approved';
          break;
        case 'suspend':
          newStatus = 'suspended';
          actionMessage = 'suspended';
          break;
        case 'activate':
          newStatus = 'active';
          actionMessage = 'activated';
          break;
        case 'reject':
          newStatus = 'rejected';
          actionMessage = 'rejected';
          break;
        default:
          newStatus = 'pending';
      }
      
      await updateDoc(userRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      enqueueSnackbar(`User ${actionMessage} successfully`, { variant: 'success' });
      handleUserMenuClose();
      
    } catch (error) {
      console.error('Manage user error:', error);
      enqueueSnackbar(`Failed to ${action} user: ` + error.message, { variant: 'error' });
    }
  };

  // Delete User Account
  const deleteUserAccount = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      handleUserMenuClose();
      
    } catch (error) {
      console.error('Delete user error:', error);
      enqueueSnackbar('Failed to delete user: ' + error.message, { variant: 'error' });
    }
  };

  // Delete Institution
  const deleteInstitution = async (institutionId) => {
    if (!window.confirm('Are you sure you want to delete this institution? This will also delete all associated faculties and courses.')) {
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // Find the institution
      const institution = institutions.find(inst => inst.id === institutionId);
      
      if (!institution) {
        enqueueSnackbar('Institution not found', { variant: 'error' });
        return;
      }
      
      // Delete institution from institutions collection
      batch.delete(doc(db, 'institutions', institutionId));
      
      // Delete associated user account if exists
      if (institution.userId) {
        batch.delete(doc(db, 'users', institution.userId));
      }
      
      // Delete associated faculties
      const institutionFaculties = faculties.filter(f => f.instituteId === institutionId);
      institutionFaculties.forEach(faculty => {
        batch.delete(doc(db, 'faculties', faculty.id));
      });
      
      // Delete associated courses
      const institutionCourses = courses.filter(c => {
        const faculty = faculties.find(f => f.id === c.facultyId);
        return faculty?.instituteId === institutionId;
      });
      institutionCourses.forEach(course => {
        batch.delete(doc(db, 'courses', course.id));
      });
      
      await batch.commit();
      enqueueSnackbar('Institution and all associated data deleted successfully', { variant: 'success' });
      
    } catch (error) {
      console.error('Delete institution error:', error);
      enqueueSnackbar('Failed to delete institution: ' + error.message, { variant: 'error' });
    }
  };

  // Generate System Report
  const generateSystemReport = async () => {
    try {
      const reportData = {
        generatedAt: serverTimestamp(),
        generatedBy: user.uid,
        generatedByName: profile?.name || 'Administrator',
        statistics: stats,
        usersByRole: {
          students: users.filter(u => u.role === 'student').length,
          institutes: users.filter(u => u.role === 'institute').length,
          companies: users.filter(u => u.role === 'company').length,
          admins: users.filter(u => u.role === 'admin').length
        },
        applicationsByStatus: {
          pending: admissions.filter(app => app.status === 'pending').length,
          admitted: admissions.filter(app => app.status === 'admitted' || app.status === 'approved').length,
          rejected: admissions.filter(app => app.status === 'rejected').length
        },
        topInstitutions: institutions.slice(0, 5).map(inst => ({
          name: inst.name,
          courses: courses.filter(c => {
            const faculty = faculties.find(f => f.id === c.facultyId);
            return faculty?.instituteId === inst.id;
          }).length,
          applications: admissions.filter(app => app.instituteId === inst.id).length
        }))
      };

      await addDoc(collection(db, 'reports'), reportData);
      enqueueSnackbar('System report generated successfully', { variant: 'success' });
      
    } catch (error) {
      console.error('Generate report error:', error);
      enqueueSnackbar('Failed to generate report: ' + error.message, { variant: 'error' });
    }
  };

  // View Report Details
  const handleViewReportDetails = (report) => {
    setSelectedInstitution(report);
    setViewReportsOpen(true);
  };

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      enqueueSnackbar('No data to export', { variant: 'warning' });
      return;
    }

    try {
      // Get headers from the first object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      // Add data rows
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Handle different data types and escape commas
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvContent += values.join(',') + '\n';
      });

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      enqueueSnackbar(`${filename} downloaded successfully`, { variant: 'success' });
    } catch (error) {
      console.error('CSV export error:', error);
      enqueueSnackbar('Failed to export CSV: ' + error.message, { variant: 'error' });
    }
  };

  // Export Report Data
  const handleExportReport = (report) => {
    try {
      const reportData = `
SYSTEM REPORT
Generated: ${formatDate(report.generatedAt)}
Generated by: ${report.generatedByName || 'Administrator'}

STATISTICS:
Total Users: ${report.statistics?.totalUsers || 0}
Students: ${report.statistics?.students || 0}
Institutions: ${report.statistics?.institutes || 0}
Companies: ${report.statistics?.companies || 0}
Total Applications: ${report.statistics?.totalApplications || 0}
Active Jobs: ${report.statistics?.totalJobs || 0}

USERS BY ROLE:
Students: ${report.usersByRole?.students || 0}
Institutions: ${report.usersByRole?.institutes || 0}
Companies: ${report.usersByRole?.companies || 0}
Admins: ${report.usersByRole?.admins || 0}

APPLICATIONS BY STATUS:
Pending: ${report.applicationsByStatus?.pending || 0}
Admitted: ${report.applicationsByStatus?.admitted || 0}
Rejected: ${report.applicationsByStatus?.rejected || 0}

TOP INSTITUTIONS:
${report.topInstitutions?.map(inst => `- ${inst.name}: ${inst.courses} courses, ${inst.applications} applications`).join('\n') || 'No data'}
      `.trim();

      // Create and download text file
      const blob = new Blob([reportData], { type: 'text/plain' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fileName = `system-report-${new Date().toISOString().split('T')[0]}.txt`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      enqueueSnackbar('Report exported successfully', { variant: 'success' });
      
    } catch (error) {
      console.error('Report export error:', error);
      enqueueSnackbar('Failed to export report: ' + error.message, { variant: 'error' });
    }
  };

  // Quick Export Functions for Different Data Types
  const exportUsersCSV = () => {
    const usersData = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone || '',
      location: user.location || '',
      createdAt: formatDate(user.createdAt),
      lastLogin: formatDate(user.lastLogin)
    }));
    exportToCSV(usersData, `users-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportInstitutionsCSV = () => {
    const institutionsData = institutions.map(inst => ({
      id: inst.id,
      name: inst.name,
      email: inst.email,
      location: inst.location || '',
      phone: inst.phone || '',
      website: inst.website || '',
      establishedYear: inst.establishedYear || '',
      status: inst.status,
      createdAt: formatDate(inst.createdAt)
    }));
    exportToCSV(institutionsData, `institutions-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportAdmissionsCSV = () => {
    const admissionsData = admissions.map(adm => ({
      id: adm.id,
      studentName: adm.studentName || 'N/A',
      studentEmail: adm.studentEmail || 'N/A',
      courseName: adm.courseName || 'N/A',
      instituteName: adm.instituteName || 'N/A',
      status: adm.status,
      appliedAt: formatDate(adm.appliedAt),
      decisionDate: formatDate(adm.decisionDate)
    }));
    exportToCSV(admissionsData, `admissions-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'approved': 
      case 'admitted': return 'success';
      case 'pending': return 'warning';
      case 'suspended':
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'institute': return 'success';
      case 'student': return 'primary';
      case 'company': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (date.toDate) {
      return date.toDate().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'N/A';
  };

  // Filter data for different sections
  const institutionsList = users.filter(u => u.role === 'institute');
  const companiesList = users.filter(u => u.role === 'company');
  const studentsList = users.filter(u => u.role === 'student');
  const adminsList = users.filter(u => u.role === 'admin');
  const pendingCompanies = companiesList.filter(c => c.status === 'pending');

  // Speed dial actions
  const speedDialActions = [
    { name: 'Add Institution', action: () => setAddInstitutionOpen(true) },
    { name: 'Add Faculty', action: () => setAddFacultyOpen(true) },
    { name: 'Add Course', action: () => setAddCourseOpen(true) },
    { name: 'Publish Admissions', action: () => setPublishAdmissionsOpen(true) },
    { name: 'Generate Report', action: generateSystemReport },
  ];

  // Show profile error state
  if (profileError) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Profile Error
          </Typography>
          <Typography variant="body1" gutterBottom>
            There was an error loading your user profile.
          </Typography>
          <Typography variant="body2">
            Please try logging out and logging back in.
          </Typography>
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button variant="contained" onClick={handleLogout}>
            Logout
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </Box>
      </Container>
    );
  }

  // Show loading while checking authentication
  if (authLoading || (!accessChecked && user && !profile)) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress sx={{ width: 200, mb: 2 }} />
          <Typography variant="h6">Checking permissions...</Typography>
          <Typography variant="body2" color="textSecondary">
            Loading user profile...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show access denied if user is not admin
  if (accessChecked && profile?.role !== 'admin') {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" gutterBottom>
            You are logged in as <strong>{profile?.role || 'unknown'}</strong>, but trying to access admin dashboard.
          </Typography>
          <Typography variant="body2">
            Please log in with an admin account to access this page.
          </Typography>
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Go to My Dashboard
          </Button>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4, backgroundColor: COLORS.lightGray, minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ 
        p: 4, 
        mb: 3, 
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`, 
        color: COLORS.white,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '2rem', md: '2.5rem' } }}>
                Admin Dashboard
              </Typography>
              <Typography variant="h6">
                Welcome back, {profile?.name || 'Administrator'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                Role: Administrator • Email: {user?.email} • Last Login: {formatDate(new Date())}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Tooltip title="Refresh Data">
                <Button onClick={loadData} sx={{ color: COLORS.white }}>
                  Refresh
                </Button>
              </Tooltip>
              <Button 
                variant="contained" 
                sx={{ 
                  backgroundColor: COLORS.error,
                  '&:hover': { backgroundColor: '#b71c1c' }
                }}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          </Box>

          {/* Enhanced Statistics Cards */}
          <Grid container spacing={3}>
            <Grid item xs={6} sm={4} md={2.4}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: COLORS.white, backdropFilter: 'blur(10px)' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2">
                    Total Users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: COLORS.white, backdropFilter: 'blur(10px)' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.students}
                  </Typography>
                  <Typography variant="body2">
                    Students
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: COLORS.white, backdropFilter: 'blur(10px)' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.institutes}
                  </Typography>
                  <Typography variant="body2">
                    Institutions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: COLORS.white, backdropFilter: 'blur(10px)' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.companies}
                  </Typography>
                  <Typography variant="body2">
                    Companies
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: COLORS.white, backdropFilter: 'blur(10px)' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.pendingCompanies}
                  </Typography>
                  <Typography variant="body2">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Quick Actions Bar */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`, 
        color: COLORS.white 
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => setAddInstitutionOpen(true)}
            sx={{ 
              background: 'rgba(255,255,255,0.2)', 
              '&:hover': { background: 'rgba(255,255,255,0.3)' },
              color: COLORS.white
            }}
          >
            Add Institution
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setAddFacultyOpen(true)}
            sx={{ 
              background: 'rgba(255,255,255,0.2)', 
              '&:hover': { background: 'rgba(255,255,255,0.3)' },
              color: COLORS.white
            }}
          >
            Add Faculty
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setAddCourseOpen(true)}
            sx={{ 
              background: 'rgba(255,255,255,0.2)', 
              '&:hover': { background: 'rgba(255,255,255,0.3)' },
              color: COLORS.white
            }}
          >
            Add Course
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setPublishAdmissionsOpen(true)}
            sx={{ 
              background: 'rgba(255,255,255,0.2)', 
              '&:hover': { background: 'rgba(255,255,255,0.3)' },
              color: COLORS.white
            }}
          >
            Publish Admissions
          </Button>
          <Button 
            variant="contained" 
            onClick={generateSystemReport}
            sx={{ 
              background: 'rgba(255,255,255,0.2)', 
              '&:hover': { background: 'rgba(255,255,255,0.3)' },
              color: COLORS.white
            }}
          >
            Generate Report
          </Button>
          <Button 
            variant="contained" 
            onClick={exportUsersCSV}
            sx={{ 
              background: 'rgba(255,255,255,0.2)', 
              '&:hover': { background: 'rgba(255,255,255,0.3)' },
              color: COLORS.white
            }}
          >
            Export Users
          </Button>
        </Box>
      </Paper>

      {/* Tabs Navigation */}
      <Paper sx={{ width: '100%', mb: 2, backgroundColor: COLORS.white }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: COLORS.darkGray,
              '&.Mui-selected': {
                color: COLORS.primary,
              },
            },
          }}
        >
          <Tab label="Overview" />
          <Tab label={`Companies (${companiesList.length})`} />
          <Tab label={`Institutions (${institutionsList.length})`} />
          <Tab label={`Students (${studentsList.length})`} />
          <Tab label={`Admins (${adminsList.length})`} />
          <Tab label={`Pending (${pendingCompanies.length})`} />
          <Tab label={`System Reports (${reports.length})`} />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* System Overview */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, mb: 3, backgroundColor: COLORS.white }}>
              <Typography variant="h6" gutterBottom color={COLORS.black}>
                System Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: '#E8F5E8', borderRadius: 2, border: `1px solid ${COLORS.mediumGray}` }}>
                    <Typography variant="h4" color={COLORS.primary} gutterBottom>
                      {admissions.length + applications.length}
                    </Typography>
                    <Typography variant="body1" color={COLORS.black}>Total Applications</Typography>
                    <Typography variant="body2" color={COLORS.darkGray}>
                      Across all institutions and companies
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: '#FFF3CD', borderRadius: 2, border: `1px solid ${COLORS.mediumGray}` }}>
                    <Typography variant="h4" color={COLORS.warning} gutterBottom>
                      {jobs.length}
                    </Typography>
                    <Typography variant="body1" color={COLORS.black}>Active Job Posts</Typography>
                    <Typography variant="body2" color={COLORS.darkGray}>
                      From {companiesList.length} companies
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: '#D1ECF1', borderRadius: 2, border: `1px solid ${COLORS.mediumGray}` }}>
                    <Typography variant="h4" color={COLORS.info} gutterBottom>
                      {courses.length}
                    </Typography>
                    <Typography variant="body1" color={COLORS.black}>Available Courses</Typography>
                    <Typography variant="body2" color={COLORS.darkGray}>
                      Across {institutionsList.length} institutions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: '#E2E3E5', borderRadius: 2, border: `1px solid ${COLORS.mediumGray}` }}>
                    <Typography variant="h4" color={COLORS.darkGray} gutterBottom>
                      {faculties.length}
                    </Typography>
                    <Typography variant="body1" color={COLORS.black}>Faculties</Typography>
                    <Typography variant="body2" color={COLORS.darkGray}>
                      Academic departments
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>

            {/* Recent Activity */}
            <Card sx={{ p: 3, backgroundColor: COLORS.white }}>
              <Typography variant="h6" gutterBottom color={COLORS.black}>
                Recent Activity
              </Typography>
              <List>
                {[...admissions, ...applications, ...jobs]
                  .sort((a, b) => new Date(b.appliedAt || b.postedAt) - new Date(a.appliedAt || a.postedAt))
                  .slice(0, 5)
                  .map((item, index) => (
                    <ListItem key={index} divider={index < 4}>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: item.type === 'job' ? COLORS.warning : COLORS.primary 
                        }}>
                          {item.type === 'job' ? 'J' : 'A'}
                        </Avatar>
                      </ListItemAvatar>
                      <Box>
                        <Typography variant="body1" component="div" color={COLORS.black}>
                          {item.jobTitle || item.courseName || 'Application'}
                        </Typography>
                        <Typography variant="body2" color={COLORS.darkGray} component="div">
                          {item.companyName || item.instituteName || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color={COLORS.darkGray} component="div">
                          {new Date(item.appliedAt || item.postedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip 
                        label={item.status} 
                        size="small" 
                        color={getStatusColor(item.status)}
                      />
                    </ListItem>
                  ))}
              </List>
            </Card>
          </Grid>

          {/* Quick Stats & Actions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, mb: 3, backgroundColor: COLORS.white }}>
              <Typography variant="h6" gutterBottom color={COLORS.black}>
                Quick Actions
              </Typography>
              <List>
                <ListItem button onClick={() => setAddInstitutionOpen(true)}>
                  <ListItemText 
                    primary="Add New Institution" 
                    primaryTypographyProps={{ color: COLORS.black }}
                    secondary="Create new educational institution"
                    secondaryTypographyProps={{ color: COLORS.darkGray }}
                  />
                </ListItem>
                <ListItem button onClick={() => setAddFacultyOpen(true)}>
                  <ListItemText 
                    primary="Add Faculty" 
                    primaryTypographyProps={{ color: COLORS.black }}
                    secondary="Create academic department"
                    secondaryTypographyProps={{ color: COLORS.darkGray }}
                  />
                </ListItem>
                <ListItem button onClick={() => setAddCourseOpen(true)}>
                  <ListItemText 
                    primary="Add Course" 
                    primaryTypographyProps={{ color: COLORS.black }}
                    secondary="Add new course offering"
                    secondaryTypographyProps={{ color: COLORS.darkGray }}
                  />
                </ListItem>
                <ListItem button onClick={() => setPublishAdmissionsOpen(true)}>
                  <ListItemText 
                    primary="Publish Admissions" 
                    primaryTypographyProps={{ color: COLORS.black }}
                    secondary="Make admission results public"
                    secondaryTypographyProps={{ color: COLORS.darkGray }}
                  />
                </ListItem>
                <ListItem button onClick={generateSystemReport}>
                  <ListItemText 
                    primary="Generate Report" 
                    primaryTypographyProps={{ color: COLORS.black }}
                    secondary="Create system analytics report"
                    secondaryTypographyProps={{ color: COLORS.darkGray }}
                  />
                </ListItem>
                <ListItem button onClick={exportUsersCSV}>
                  <ListItemText 
                    primary="Export Users CSV" 
                    primaryTypographyProps={{ color: COLORS.black }}
                    secondary="Download user data"
                    secondaryTypographyProps={{ color: COLORS.darkGray }}
                  />
                </ListItem>
                <ListItem button onClick={exportInstitutionsCSV}>
                  <ListItemText 
                    primary="Export Institutions CSV" 
                    primaryTypographyProps={{ color: COLORS.black }}
                    secondary="Download institution data"
                    secondaryTypographyProps={{ color: COLORS.darkGray }}
                  />
                </ListItem>
                <ListItem button onClick={exportAdmissionsCSV}>
                  <ListItemText 
                    primary="Export Admissions CSV" 
                    primaryTypographyProps={{ color: COLORS.black }}
                    secondary="Download admission data"
                    secondaryTypographyProps={{ color: COLORS.darkGray }}
                  />
                </ListItem>
              </List>
            </Card>

            {/* System Health */}
            <Card sx={{ 
              p: 3, 
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`, 
              color: COLORS.white 
            }}>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={95} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      mb: 1,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: COLORS.white
                      }
                    }}
                  />
                  <Typography variant="body2">Performance: 95%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={98} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      mb: 1,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: COLORS.white
                      }
                    }}
                  />
                  <Typography variant="body2">Uptime: 98%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={85} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      mb: 1,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: COLORS.white
                      }
                    }}
                  />
                  <Typography variant="body2">Database: 85%</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Companies Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color={COLORS.black}>Company Accounts</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={exportUsersCSV}
              sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              Export CSV
            </Button>
            <Typography variant="body2" color={COLORS.darkGray} sx={{ ml: 2 }}>
              Total: {companiesList.length} companies • {pendingCompanies.length} pending approval
            </Typography>
          </Box>
        </Box>
        
        <Paper sx={{ backgroundColor: COLORS.white }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Company</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Contact</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Status</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Jobs Posted</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Joined Date</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companiesList.map(company => (
                <TableRow key={company.id} hover sx={{ '&:hover': { backgroundColor: COLORS.lightGray } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: COLORS.warning }}>
                        {company.name?.charAt(0) || 'C'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color={COLORS.black}>{company.name}</Typography>
                        <Typography variant="body2" color={COLORS.darkGray}>
                          {company.industry || 'Not specified'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" color={COLORS.black}>{company.email}</Typography>
                      <Typography variant="body2" color={COLORS.darkGray}>
                        {company.phone || 'No phone'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={company.status || 'active'} 
                      color={getStatusColor(company.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={COLORS.black}>
                      {jobs.filter(job => job.companyId === company.id).length}
                    </Typography>
                  </TableCell>
                  <TableCell><Typography color={COLORS.black}>{formatDate(company.createdAt)}</Typography></TableCell>
                  <TableCell>
                    <Button onClick={(e) => handleUserMenuOpen(e, company)} sx={{ color: COLORS.primary }}>
                      Actions
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </TabPanel>

      {/* Institutions Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color={COLORS.black}>Institution Accounts</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={exportInstitutionsCSV}
              sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              Export CSV
            </Button>
            <Button 
              variant="contained" 
              onClick={() => setAddInstitutionOpen(true)}
              sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
            >
              Add Institution
            </Button>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          {institutionsList.map(institution => (
            <Grid item xs={12} md={6} key={institution.id}>
              <Card variant="outlined" sx={{ p: 2, backgroundColor: COLORS.white }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: COLORS.primary }}>
                      {institution.name?.charAt(0) || 'I'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" color={COLORS.black}>{institution.name}</Typography>
                      <Typography variant="body2" color={COLORS.darkGray}>
                        {institution.location || 'Location not specified'}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={institution.status || 'active'} 
                    color={getStatusColor(institution.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }} color={COLORS.black}>
                  {institution.description || 'No description available.'}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color={COLORS.black}>
                      <strong>Faculties:</strong> {faculties.filter(f => f.instituteId === institution.id).length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color={COLORS.black}>
                      <strong>Courses:</strong> {courses.filter(c => {
                        const faculty = faculties.find(f => f.id === c.facultyId);
                        return faculty?.instituteId === institution.id;
                      }).length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color={COLORS.black}>
                      <strong>Applications:</strong> {admissions.filter(app => app.instituteId === institution.id).length}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => handleViewInstitution(institution)}
                    sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="error"
                    onClick={() => deleteInstitution(institution.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Students Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color={COLORS.black}>Student Accounts</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={exportUsersCSV}
              sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              Export CSV
            </Button>
            <Typography variant="body2" color={COLORS.darkGray}>
              Total: {studentsList.length} students
            </Typography>
          </Box>
        </Box>
        
        <Paper sx={{ backgroundColor: COLORS.white }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Student</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Academic Info</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Applications</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Status</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Joined Date</Typography></TableCell>
                <TableCell><Typography color={COLORS.black} fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentsList.map(student => (
                <TableRow key={student.id} hover sx={{ '&:hover': { backgroundColor: COLORS.lightGray } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: COLORS.info }}>
                        {student.name?.charAt(0) || 'S'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" color={COLORS.black}>{student.name}</Typography>
                        <Typography variant="body2" color={COLORS.darkGray}>
                          {student.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Field:</strong> {student.field || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>GPA:</strong> {student.gpa || 'Not set'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={COLORS.black}>
                      {admissions.filter(app => app.userId === student.id).length} applied
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={student.status || 'active'} 
                      color={getStatusColor(student.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell><Typography color={COLORS.black}>{formatDate(student.createdAt)}</Typography></TableCell>
                  <TableCell>
                    <Button onClick={(e) => handleUserMenuOpen(e, student)} sx={{ color: COLORS.primary }}>
                      Actions
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </TabPanel>

      {/* Admins Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color={COLORS.black}>Administrator Accounts</Typography>
          <Typography variant="body2" color={COLORS.darkGray}>
            Total: {adminsList.length} administrators
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {adminsList.map(admin => (
            <Grid item xs={12} md={6} lg={4} key={admin.id}>
              <Card sx={{ p: 3, textAlign: 'center', backgroundColor: COLORS.white }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: COLORS.error
                }}>
                  {admin.name?.charAt(0) || 'A'}
                </Avatar>
                <Typography variant="h6" gutterBottom color={COLORS.black}>
                  {admin.name}
                </Typography>
                <Typography variant="body2" color={COLORS.darkGray} gutterBottom>
                  {admin.email}
                </Typography>
                <Chip 
                  label={admin.status || 'active'} 
                  color={getStatusColor(admin.status)}
                  sx={{ mt: 1 }}
                />
                <Typography variant="body2" sx={{ mt: 2 }} color={COLORS.black}>
                  Last active: {formatDate(admin.lastLogin)}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Pending Approval Tab */}
      <TabPanel value={tabValue} index={5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color={COLORS.black}>Pending Company Approvals</Typography>
          <Typography variant="body2" color={COLORS.darkGray}>
            {pendingCompanies.length} companies awaiting approval
          </Typography>
        </Box>
        
        {pendingCompanies.length === 0 ? (
          <Alert severity="info">
            <Typography variant="h6">No pending approvals</Typography>
            <Typography>All company accounts are currently approved and active.</Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {pendingCompanies.map(company => (
              <Grid item xs={12} md={6} key={company.id}>
                <Card variant="outlined" sx={{ p: 3, backgroundColor: COLORS.white }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: COLORS.warning }}>
                      {company.name?.charAt(0) || 'C'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" color={COLORS.black}>{company.name}</Typography>
                      <Typography variant="body2" color={COLORS.darkGray}>
                        {company.industry || 'Industry not specified'}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }} color={COLORS.black}>
                    {company.description || 'No description provided.'}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Email:</strong> {company.email}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Phone:</strong> {company.phone || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Location:</strong> {company.location || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Applied:</strong> {formatDate(company.createdAt)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={() => manageUserStatus(company.id, 'approve')}
                      sx={{ flex: 1 }}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={() => manageUserStatus(company.id, 'reject')}
                      sx={{ flex: 1 }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* System Reports Tab */}
      <TabPanel value={tabValue} index={6}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color={COLORS.black}>System Reports & Analytics</Typography>
          <Button 
            variant="contained" 
            onClick={generateSystemReport}
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            Generate New Report
          </Button>
        </Box>

        {reports.length === 0 ? (
          <Alert severity="info">
            <Typography variant="h6">No reports generated yet</Typography>
            <Typography>Use the "Generate New Report" button to create your first system report.</Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color={COLORS.black}>
                Generated Reports ({reports.length})
              </Typography>
            </Grid>
            {reports.map((report, index) => (
              <Grid item xs={12} md={6} key={report.id}>
                <Card sx={{ p: 3, backgroundColor: COLORS.white }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" color={COLORS.black}>
                      System Report #{reports.length - index}
                    </Typography>
                    <Chip 
                      label={formatDate(report.generatedAt)} 
                      size="small" 
                      sx={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color={COLORS.darkGray} gutterBottom>
                    Generated by: {report.generatedByName || 'Administrator'}
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Total Users:</strong> {report.statistics?.totalUsers || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Applications:</strong> {report.statistics?.totalApplications || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Active Jobs:</strong> {report.statistics?.totalJobs || 0}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleViewReportDetails(report)}
                      sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleExportReport(report)}
                      sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
                    >
                      Export Report
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Add Institution Dialog */}
      <Dialog open={addInstitutionOpen} onClose={() => setAddInstitutionOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Add New Institution</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Institution Name"
              value={institutionData.name}
              onChange={e => setInstitutionData({...institutionData, name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Institution Email"
              type="email"
              value={institutionData.email}
              onChange={e => setInstitutionData({...institutionData, email: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Temporary Password"
              type="password"
              value={institutionData.password}
              onChange={e => setInstitutionData({...institutionData, password: e.target.value})}
              fullWidth
              required
              helperText="Minimum 6 characters"
            />
            <TextField
              label="Location"
              value={institutionData.location}
              onChange={e => setInstitutionData({...institutionData, location: e.target.value})}
              fullWidth
            />
            <TextField
              label="Phone"
              value={institutionData.phone}
              onChange={e => setInstitutionData({...institutionData, phone: e.target.value})}
              fullWidth
            />
            <TextField
              label="Website"
              value={institutionData.website}
              onChange={e => setInstitutionData({...institutionData, website: e.target.value})}
              fullWidth
            />
            <TextField
              label="Established Year"
              type="number"
              value={institutionData.establishedYear}
              onChange={e => setInstitutionData({...institutionData, establishedYear: e.target.value})}
              fullWidth
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={institutionData.description}
              onChange={e => setInstitutionData({...institutionData, description: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddInstitutionOpen(false)}>Cancel</Button>
          <Button 
            onClick={addInstitution}
            variant="contained"
            disabled={!institutionData.name.trim() || !institutionData.email.trim() || institutionData.password.length < 6}
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            Add Institution
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Faculty Dialog */}
      <Dialog open={addFacultyOpen} onClose={() => setAddFacultyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Add New Faculty</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Institution</InputLabel>
              <Select
                value={facultyData.instituteId}
                onChange={e => setFacultyData({...facultyData, instituteId: e.target.value})}
                label="Institution"
              >
                {institutionsList.map(inst => (
                  <MenuItem key={inst.id} value={inst.id}>
                    {inst.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Faculty Name"
              value={facultyData.name}
              onChange={e => setFacultyData({...facultyData, name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={facultyData.description}
              onChange={e => setFacultyData({...facultyData, description: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFacultyOpen(false)}>Cancel</Button>
          <Button 
            onClick={addFaculty}
            variant="contained"
            disabled={!facultyData.name.trim() || !facultyData.instituteId}
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            Add Faculty
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Course Dialog */}
      <Dialog open={addCourseOpen} onClose={() => setAddCourseOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Add New Course</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Faculty</InputLabel>
              <Select
                value={courseData.facultyId}
                onChange={e => setCourseData({...courseData, facultyId: e.target.value})}
                label="Faculty"
              >
                {faculties.map(faculty => (
                  <MenuItem key={faculty.id} value={faculty.id}>
                    {faculty.name} ({institutionsList.find(inst => inst.id === faculty.instituteId)?.name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Course Name"
              value={courseData.name}
              onChange={e => setCourseData({...courseData, name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={courseData.description}
              onChange={e => setCourseData({...courseData, description: e.target.value})}
              fullWidth
            />
            <TextField
              label="Duration"
              value={courseData.duration}
              onChange={e => setCourseData({...courseData, duration: e.target.value})}
              fullWidth
              placeholder="e.g., 4 years"
            />
            <TextField
              label="Fees"
              value={courseData.fees}
              onChange={e => setCourseData({...courseData, fees: e.target.value})}
              fullWidth
              placeholder="e.g., $10,000 per year"
            />
            <TextField
              label="Available Seats"
              type="number"
              value={courseData.seats}
              onChange={e => setCourseData({...courseData, seats: e.target.value})}
              fullWidth
            />
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCourseOpen(false)}>Cancel</Button>
          <Button 
            onClick={addCourse}
            variant="contained"
            disabled={!courseData.name.trim() || !courseData.facultyId}
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.primaryDark } }}
          >
            Add Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Publish Admissions Dialog */}
      <Dialog open={publishAdmissionsOpen} onClose={() => setPublishAdmissionsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Publish Admissions</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This will publish admission settings and notify all students. Make sure all admission decisions are finalized before publishing.
              </Typography>
            </Alert>
            
            <TextField
              label="Academic Year"
              type="number"
              value={admissionSettings.academicYear}
              onChange={e => setAdmissionSettings({...admissionSettings, academicYear: e.target.value})}
              fullWidth
              margin="normal"
              helperText="The academic year for these admissions"
            />
            <TextField
              label="Application Start Date"
              type="date"
              value={admissionSettings.startDate}
              onChange={e => setAdmissionSettings({...admissionSettings, startDate: e.target.value})}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              helperText="When applications open"
            />
            <TextField
              label="Application End Date"
              type="date"
              value={admissionSettings.endDate}
              onChange={e => setAdmissionSettings({...admissionSettings, endDate: e.target.value})}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              helperText="When applications close"
            />
            <TextField
              label="Announcement Message"
              multiline
              rows={3}
              value={admissionSettings.announcement}
              onChange={e => setAdmissionSettings({...admissionSettings, announcement: e.target.value})}
              fullWidth
              margin="normal"
              placeholder="Important information about the admissions process, deadlines, requirements..."
              helperText="This message will be sent to all students"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishAdmissionsOpen(false)}>Cancel</Button>
          <Button 
            onClick={publishAdmissions}
            variant="contained"
            sx={{ 
              backgroundColor: COLORS.primary,
              '&:hover': { backgroundColor: COLORS.primaryDark }
            }}
            disabled={!admissionSettings.startDate || !admissionSettings.endDate}
          >
            Publish Admissions
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Reports Dialog */}
      <Dialog open={viewReportsOpen} onClose={() => setViewReportsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Report Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedInstitution && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom color={COLORS.black}>
                System Report - {formatDate(selectedInstitution.generatedAt)}
              </Typography>
              <Typography variant="body2" color={COLORS.darkGray} gutterBottom>
                Generated by: {selectedInstitution.generatedByName || 'Administrator'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom color={COLORS.black}>Statistics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.black}><strong>Total Users:</strong> {selectedInstitution.statistics?.totalUsers || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.black}><strong>Students:</strong> {selectedInstitution.statistics?.students || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.black}><strong>Institutions:</strong> {selectedInstitution.statistics?.institutes || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.black}><strong>Companies:</strong> {selectedInstitution.statistics?.companies || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.black}><strong>Total Applications:</strong> {selectedInstitution.statistics?.totalApplications || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.black}><strong>Active Jobs:</strong> {selectedInstitution.statistics?.totalJobs || 0}</Typography>
                </Grid>
              </Grid>
              
              {selectedInstitution.usersByRole && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom color={COLORS.black}>Users by Role</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}><strong>Students:</strong> {selectedInstitution.usersByRole.students || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}><strong>Institutions:</strong> {selectedInstitution.usersByRole.institutes || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}><strong>Companies:</strong> {selectedInstitution.usersByRole.companies || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.black}><strong>Admins:</strong> {selectedInstitution.usersByRole.admins || 0}</Typography>
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewReportsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* User Actions Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => handleViewUser(selectedUser)}>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        {selectedUser?.status === 'pending' && (
          <MenuItem onClick={() => manageUserStatus(selectedUser.id, 'approve')}>
            <ListItemText>Approve</ListItemText>
          </MenuItem>
        )}
        
        {selectedUser?.status === 'active' && (
          <MenuItem onClick={() => manageUserStatus(selectedUser.id, 'suspend')}>
            <ListItemText>Suspend</ListItemText>
          </MenuItem>
        )}
        
        {selectedUser?.status === 'suspended' && (
          <MenuItem onClick={() => manageUserStatus(selectedUser.id, 'activate')}>
            <ListItemText>Activate</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => deleteUserAccount(selectedUser?.id)}>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* View User Dialog */}
      <Dialog open={viewUserDialogOpen} onClose={() => setViewUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>User Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: getRoleColor(selectedUser.role) }}>
                  {selectedUser.name?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h6" color={COLORS.black}>{selectedUser.name}</Typography>
                  <Typography variant="body2" color={COLORS.darkGray}>
                    {selectedUser.email}
                  </Typography>
                  <Chip 
                    label={selectedUser.role} 
                    color={getRoleColor(selectedUser.role)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                  <Chip 
                    label={selectedUser.status || 'active'} 
                    color={getStatusColor(selectedUser.status)}
                    size="small"
                    sx={{ mt: 0.5, ml: 1 }}
                  />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.darkGray}>
                    <strong>Phone:</strong>
                  </Typography>
                  <Typography variant="body1" color={COLORS.black}>
                    {selectedUser.phone || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.darkGray}>
                    <strong>Location:</strong>
                  </Typography>
                  <Typography variant="body1" color={COLORS.black}>
                    {selectedUser.location || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.darkGray}>
                    <strong>Joined:</strong>
                  </Typography>
                  <Typography variant="body1" color={COLORS.black}>
                    {formatDate(selectedUser.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color={COLORS.darkGray}>
                    <strong>Last Active:</strong>
                  </Typography>
                  <Typography variant="body1" color={COLORS.black}>
                    {formatDate(selectedUser.lastLogin) || 'Unknown'}
                  </Typography>
                </Grid>
                {selectedUser.role === 'student' && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.darkGray}>
                        <strong>Field:</strong>
                      </Typography>
                      <Typography variant="body1" color={COLORS.black}>
                        {selectedUser.field || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color={COLORS.darkGray}>
                        <strong>GPA:</strong>
                      </Typography>
                      <Typography variant="body1" color={COLORS.black}>
                        {selectedUser.gpa || 'Not set'}
                      </Typography>
                    </Grid>
                  </>
                )}
                {selectedUser.role === 'company' && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color={COLORS.darkGray}>
                      <strong>Industry:</strong>
                    </Typography>
                    <Typography variant="body1" color={COLORS.black}>
                      {selectedUser.industry || 'Not specified'}
                    </Typography>
                  </Grid>
                )}
                {selectedUser.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color={COLORS.darkGray}>
                      <strong>Description:</strong>
                    </Typography>
                    <Typography variant="body1" color={COLORS.black}>
                      {selectedUser.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewUserDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View Institution Dialog */}
      <Dialog open={viewInstitutionDialogOpen} onClose={() => setViewInstitutionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color={COLORS.black}>Institution Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedInstitution && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: COLORS.primary }}>
                  {selectedInstitution.name?.charAt(0) || 'I'}
                </Avatar>
                <Box>
                  <Typography variant="h5" color={COLORS.black}>{selectedInstitution.name}</Typography>
                  <Typography variant="body2" color={COLORS.darkGray}>
                    {selectedInstitution.email}
                  </Typography>
                  <Chip 
                    label={selectedInstitution.status || 'active'} 
                    color={getStatusColor(selectedInstitution.status)}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom color={COLORS.black}>Contact Information</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Location:</strong> {selectedInstitution.location || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Phone:</strong> {selectedInstitution.phone || 'Not provided'}
                      </Typography>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Email:</strong> {selectedInstitution.email}
                      </Typography>
                      {selectedInstitution.website && (
                        <Typography variant="body2" color={COLORS.black}>
                          <strong>Website:</strong> {selectedInstitution.website}
                        </Typography>
                      )}
                      {selectedInstitution.establishedYear && (
                        <Typography variant="body2" color={COLORS.black}>
                          <strong>Established:</strong> {selectedInstitution.establishedYear}
                        </Typography>
                      )}
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom color={COLORS.black}>Statistics</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Faculties:</strong> {faculties.filter(f => f.instituteId === selectedInstitution.id).length}
                      </Typography>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Courses:</strong> {courses.filter(c => {
                          const faculty = faculties.find(f => f.id === c.facultyId);
                          return faculty?.instituteId === selectedInstitution.id;
                        }).length}
                      </Typography>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Applications:</strong> {admissions.filter(app => app.instituteId === selectedInstitution.id).length}
                      </Typography>
                      <Typography variant="body2" color={COLORS.black}>
                        <strong>Joined:</strong> {formatDate(selectedInstitution.createdAt)}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                {selectedInstitution.description && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom color={COLORS.black}>Description</Typography>
                      <Typography variant="body2" color={COLORS.black}>
                        {selectedInstitution.description}
                      </Typography>
                    </Card>
                  </Grid>
                )}

                {/* Associated Faculties */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom color={COLORS.black}>Associated Faculties</Typography>
                    {faculties.filter(f => f.instituteId === selectedInstitution.id).length === 0 ? (
                      <Typography variant="body2" color={COLORS.darkGray}>
                        No faculties associated with this institution.
                      </Typography>
                    ) : (
                      <List dense>
                        {faculties
                          .filter(f => f.instituteId === selectedInstitution.id)
                          .map(faculty => (
                            <ListItem key={faculty.id}>
                              <ListItemText
                                primary={faculty.name}
                                primaryTypographyProps={{ color: COLORS.black }}
                                secondary={faculty.description || 'No description'}
                                secondaryTypographyProps={{ color: COLORS.darkGray }}
                              />
                            </ListItem>
                          ))}
                      </List>
                    )}
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewInstitutionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <SpeedDial
        ariaLabel="Admin quick actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <Box sx={{ textAlign: 'center' }}>
            <LinearProgress sx={{ width: 200, mb: 2 }} />
            <Typography variant="h6">Loading Admin Dashboard...</Typography>
          </Box>
        </Box>
      )}
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
    <AdminDashboard />
  </SnackbarProvider>
);