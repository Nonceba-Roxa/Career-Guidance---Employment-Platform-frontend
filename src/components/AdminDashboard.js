// src/components/AdminDashboard.js
import React, { useEffect, useState, useRef } from 'react';
import { 
  Container, Typography, Table, TableBody, TableCell, TableHead, 
  TableRow, Paper, Button, Box, Card, CardContent, Grid, Chip,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, LinearProgress, IconButton, Menu, MenuItem, 
  ListItemIcon, ListItemText, Tooltip, Avatar, Tab, Tabs,
  Select, InputLabel, FormControl, Switch, FormControlLabel,
  Stepper, Step, StepLabel, StepContent, Badge, Divider,
  SpeedDial, SpeedDialAction, SpeedDialIcon, Fab,
  List, ListItem, ListItemAvatar, ListItemSecondaryAction,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
  Logout, Add, Block, CheckCircle, Pending, 
  Person, Business, School, AdminPanelSettings,
  MoreVert, Edit, Delete, Refresh, Visibility,
  Dashboard, Groups, Class, Work, Assessment,
  TrendingUp, Notifications, Security, Settings,
  ExpandMore, AddCircle, RemoveCircle, Publish,
  BarChart, PieChart, Timeline, Download,
  Email, Phone, LocationOn, CalendarToday,
  AutoAwesome, Rocket, Psychology, Analytics
} from '@mui/icons-material';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { 
  collection, onSnapshot, doc, updateDoc, addDoc, 
  query, where, getDoc, deleteDoc, getDocs, orderBy,
  writeBatch, setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

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
    totalJobs: 0,
    admissionRate: 0
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
      });

      usersUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up users listener:', error);
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
      });

      institutionsUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up institutions listener:', error);
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
      });

      facultiesUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up faculties listener:', error);
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
      });

      coursesUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up courses listener:', error);
    }
  };

  // Load applications with real-time listener
  const loadApplications = () => {
    if (!user) return;
    
    try {
      console.log('Setting up applications listener for admin');
      
      // Clean up previous listener
      if (applicationsUnsubscribeRef.current) {
        console.log('Cleaning up previous applications listener');
        applicationsUnsubscribeRef.current();
      }
      
      const admissionsQuery = query(collection(db, 'admissions'), orderBy('appliedAt', 'desc'));
      const jobAppsQuery = query(collection(db, 'jobApplications'), orderBy('appliedAt', 'desc'));
      
      const unsubscribeAdmissions = onSnapshot(admissionsQuery, (snapshot) => {
        const admissionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'admission',
          ...doc.data(),
          appliedAt: doc.data().appliedAt?.toDate?.() || new Date(doc.data().appliedAt)
        }));
        
        setApplications(prev => {
          const jobApps = prev.filter(app => app.type === 'job');
          return [...admissionsData, ...jobApps];
        });
      });

      const unsubscribeJobApps = onSnapshot(jobAppsQuery, (snapshot) => {
        const jobAppsData = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'job',
          ...doc.data(),
          appliedAt: doc.data().appliedAt?.toDate?.() || new Date(doc.data().appliedAt)
        }));
        
        setApplications(prev => {
          const admissions = prev.filter(app => app.type === 'admission');
          return [...admissions, ...jobAppsData];
        });
      });

      applicationsUnsubscribeRef.current = () => {
        unsubscribeAdmissions();
        unsubscribeJobApps();
      };
      
      return () => {
        unsubscribeAdmissions();
        unsubscribeJobApps();
      };
      
    } catch (error) {
      console.error('Error setting up applications listener:', error);
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
      });

      jobsUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up jobs listener:', error);
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
      });

      reportsUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up reports listener:', error);
    }
  };

  // Calculate statistics - FIXED to update when data changes
  const calculateStatistics = () => {
    console.log('Calculating statistics with current data:', {
      users: users.length,
      applications: applications.length,
      jobs: jobs.length
    });

    const admissions = applications.filter(app => app.type === 'admission');
    const jobApplications = applications.filter(app => app.type === 'job');

    const userStats = {
      totalUsers: users.length,
      students: users.filter(u => u.role === 'student').length,
      institutes: users.filter(u => u.role === 'institute').length,
      companies: users.filter(u => u.role === 'company').length,
      pendingCompanies: users.filter(u => u.role === 'company' && u.status === 'pending').length,
      activeUsers: users.filter(u => u.status === 'active' || !u.status).length,
      suspendedUsers: users.filter(u => u.status === 'suspended').length,
      totalApplications: admissions.length + jobApplications.length,
      totalJobs: jobs.length,
      admissionRate: admissions.length > 0 ? 
        (admissions.filter(app => app.status === 'admitted').length / admissions.length * 100).toFixed(1) : 0
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
    loadApplications();
    loadJobs();
    loadReports();

    setLoading(false);
  };

  // Effect to calculate statistics when data changes
  useEffect(() => {
    if (users.length > 0 || applications.length > 0 || jobs.length > 0) {
      calculateStatistics();
    }
  }, [users, applications, jobs]);

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

      if (user && !profile) {
        console.log('Profile missing, loading manually...');
        try {
          userProfile = await loadUserProfile(user.uid);
          if (userProfile) {
            userRole = userProfile.role;
            console.log('Manually loaded profile:', userProfile);
          } else {
            setProfileError(true);
            enqueueSnackbar('Error loading user profile', { variant: 'error' });
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

  // Add Institution - FIXED permission issues
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
      // Check if email already exists
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

      // Create the institution document in Firestore
      const userDocRef = await addDoc(collection(db, 'users'), {
        name: institutionData.name,
        email: institutionData.email,
        role: 'institute',
        status: 'active',
        location: institutionData.location,
        phone: institutionData.phone,
        website: institutionData.website,
        description: institutionData.description,
        establishedYear: institutionData.establishedYear,
        createdAt: new Date(),
        uid: institutionUser.uid
      });

      // Also add to institutions collection
      await addDoc(collection(db, 'institutions'), {
        name: institutionData.name,
        email: institutionData.email,
        location: institutionData.location,
        phone: institutionData.phone,
        website: institutionData.website,
        description: institutionData.description,
        establishedYear: institutionData.establishedYear,
        createdAt: new Date(),
        status: 'active',
        userId: userDocRef.id
      });

      enqueueSnackbar('Institution added successfully', { variant: 'success' });
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
        createdAt: new Date(),
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
        createdAt: new Date(),
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

  // Publish Admissions - FIXED document creation issue
  const publishAdmissions = async () => {
    try {
      // Create or update admission settings
      const admissionSettingsRef = doc(db, 'system', 'admissionSettings');
      
      // Use setDoc with merge: true to create if doesn't exist or update if exists
      await setDoc(admissionSettingsRef, {
        ...admissionSettings,
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: user.uid
      }, { merge: true });

      // Notify all students
      const students = users.filter(u => u.role === 'student');
      const notificationPromises = students.map(student => 
        addDoc(collection(db, 'notifications'), {
          userId: student.id,
          title: '🎓 Admissions Published!',
          message: `Admissions for ${admissionSettings.academicYear} have been published. Check your dashboard for updates.`,
          type: 'admission',
          priority: 'high',
          read: false,
          createdAt: new Date()
        })
      );

      await Promise.all(notificationPromises);

      enqueueSnackbar('Admissions published successfully! All students have been notified.', { variant: 'success' });
      setPublishAdmissionsOpen(false);
      
    } catch (error) {
      console.error('Publish admissions error:', error);
      enqueueSnackbar('Failed to publish admissions: ' + error.message, { variant: 'error' });
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
      
      await updateDoc(userRef, { status: newStatus });
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

  // Delete Institution - FIXED to properly remove from dashboard
  const deleteInstitution = async (institutionId) => {
    if (!window.confirm('Are you sure you want to delete this institution? This will also delete all associated faculties and courses.')) {
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // Find the institution user
      const institutionUser = users.find(u => u.role === 'institute' && institutions.find(inst => inst.id === institutionId)?.email === u.email);
      
      // Delete institution from institutions collection
      batch.delete(doc(db, 'institutions', institutionId));
      
      // Delete associated user account
      if (institutionUser) {
        batch.delete(doc(db, 'users', institutionUser.id));
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
      
      // The real-time listeners will automatically update the UI
      
    } catch (error) {
      console.error('Delete institution error:', error);
      enqueueSnackbar('Failed to delete institution: ' + error.message, { variant: 'error' });
    }
  };

  // Generate System Report - FIXED to show in dashboard
  const generateSystemReport = async () => {
    try {
      const reportData = {
        generatedAt: new Date(),
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
          pending: applications.filter(app => app.status === 'pending').length,
          admitted: applications.filter(app => app.status === 'admitted').length,
          rejected: applications.filter(app => app.status === 'rejected').length
        },
        topInstitutions: institutions.slice(0, 5).map(inst => ({
          name: inst.name,
          courses: courses.filter(c => {
            const faculty = faculties.find(f => f.id === c.facultyId);
            return faculty?.instituteId === inst.id;
          }).length,
          applications: applications.filter(app => app.instituteId === inst.id).length
        }))
      };

      await addDoc(collection(db, 'reports'), reportData);
      enqueueSnackbar('System report generated successfully', { variant: 'success' });
      
    } catch (error) {
      console.error('Generate report error:', error);
      enqueueSnackbar('Failed to generate report: ' + error.message, { variant: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'approved': return 'success';
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

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'institute': return <School />;
      case 'student': return <Person />;
      case 'company': return <Business />;
      default: return <Person />;
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
    { icon: <Add />, name: 'Add Institution', action: () => setAddInstitutionOpen(true) },
    { icon: <Class />, name: 'Add Faculty', action: () => setAddFacultyOpen(true) },
    { icon: <School />, name: 'Add Course', action: () => setAddCourseOpen(true) },
    { icon: <Publish />, name: 'Publish Admissions', action: () => setPublishAdmissionsOpen(true) },
    { icon: <Assessment />, name: 'Generate Report', action: generateSystemReport },
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
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ 
        p: 4, 
        mb: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
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
                🛠️ Admin Dashboard
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
                <IconButton onClick={loadData} sx={{ color: 'white' }}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={handleLogout}
                startIcon={<Logout />}
              >
                Logout
              </Button>
            </Box>
          </Box>

          {/* Enhanced Statistics Cards */}
          <Grid container spacing={3}>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}>
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
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}>
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
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}>
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
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}>
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
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}>
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
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {stats.admissionRate}%
                  </Typography>
                  <Typography variant="body2">
                    Admission Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Quick Actions Bar */}
      <Paper sx={{ p: 2, mb: 3, background: 'linear-gradient(135deg, #f39c12, #e74c3c)', color: 'white' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setAddInstitutionOpen(true)}
            sx={{ background: 'rgba(255,255,255,0.2)', '&:hover': { background: 'rgba(255,255,255,0.3)' } }}
          >
            Add Institution
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Class />}
            onClick={() => setAddFacultyOpen(true)}
            sx={{ background: 'rgba(255,255,255,0.2)', '&:hover': { background: 'rgba(255,255,255,0.3)' } }}
          >
            Add Faculty
          </Button>
          <Button 
            variant="contained" 
            startIcon={<School />}
            onClick={() => setAddCourseOpen(true)}
            sx={{ background: 'rgba(255,255,255,0.2)', '&:hover': { background: 'rgba(255,255,255,0.3)' } }}
          >
            Add Course
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Publish />}
            onClick={() => setPublishAdmissionsOpen(true)}
            sx={{ background: 'rgba(255,255,255,0.2)', '&:hover': { background: 'rgba(255,255,255,0.3)' } }}
          >
            Publish Admissions
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Assessment />}
            onClick={generateSystemReport}
            sx={{ background: 'rgba(255,255,255,0.2)', '&:hover': { background: 'rgba(255,255,255,0.3)' } }}
          >
            Generate Report
          </Button>
        </Box>
      </Paper>

      {/* Tabs Navigation */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Dashboard />} label="Overview" />
          <Tab icon={<Business />} label={`Companies (${companiesList.length})`} />
          <Tab icon={<School />} label={`Institutions (${institutionsList.length})`} />
          <Tab icon={<Person />} label={`Students (${studentsList.length})`} />
          <Tab icon={<AdminPanelSettings />} label={`Admins (${adminsList.length})`} />
          <Tab icon={<Pending />} label={`Pending (${pendingCompanies.length})`} />
          <Tab icon={<Analytics />} label={`System Reports (${reports.length})`} />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* System Overview */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> System Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {applications.length}
                    </Typography>
                    <Typography variant="body1">Total Applications</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.admissionRate}% admission rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                    <Typography variant="h4" color="success" gutterBottom>
                      {jobs.length}
                    </Typography>
                    <Typography variant="body1">Active Job Posts</Typography>
                    <Typography variant="body2" color="text.secondary">
                      From {companiesList.length} companies
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                    <Typography variant="h4" color="warning" gutterBottom>
                      {courses.length}
                    </Typography>
                    <Typography variant="body1">Available Courses</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Across {institutionsList.length} institutions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                    <Typography variant="h4" color="info" gutterBottom>
                      {faculties.length}
                    </Typography>
                    <Typography variant="body1">Faculties</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Academic departments
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>

            {/* Recent Activity */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline /> Recent Activity
              </Typography>
              <List>
                {[...applications, ...jobs]
                  .sort((a, b) => new Date(b.appliedAt || b.postedAt) - new Date(a.appliedAt || a.postedAt))
                  .slice(0, 5)
                  .map((item, index) => (
                    <ListItem key={index} divider={index < 4}>
                      <ListItemAvatar>
                        <Avatar>
                          {item.jobId ? <Work /> : <School />}
                        </Avatar>
                      </ListItemAvatar>
                      <Box>
                        <Typography variant="body1" component="div">
                          {item.jobTitle || item.courseName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="div">
                          {item.companyName || item.instituteName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="div">
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
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rocket /> Quick Actions
              </Typography>
              <List>
                <ListItem button onClick={() => setAddInstitutionOpen(true)}>
                  <ListItemIcon><Add color="primary" /></ListItemIcon>
                  <ListItemText primary="Add New Institution" />
                </ListItem>
                <ListItem button onClick={() => setAddFacultyOpen(true)}>
                  <ListItemIcon><Class color="primary" /></ListItemIcon>
                  <ListItemText primary="Add Faculty" />
                </ListItem>
                <ListItem button onClick={() => setAddCourseOpen(true)}>
                  <ListItemIcon><School color="primary" /></ListItemIcon>
                  <ListItemText primary="Add Course" />
                </ListItem>
                <ListItem button onClick={() => setPublishAdmissionsOpen(true)}>
                  <ListItemIcon><Publish color="primary" /></ListItemIcon>
                  <ListItemText primary="Publish Admissions" />
                </ListItem>
                <ListItem button onClick={generateSystemReport}>
                  <ListItemIcon><Assessment color="primary" /></ListItemIcon>
                  <ListItemText primary="Generate Report" />
                </ListItem>
              </List>
            </Card>

            {/* System Health */}
            <Card sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Typography variant="h6" gutterBottom>
                🚀 System Health
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={95} 
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2">Performance: 95%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={98} 
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2">Uptime: 98%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={85} 
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
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
          <Typography variant="h5">Company Accounts</Typography>
          <Typography variant="body2" color="textSecondary">
            Total: {companiesList.length} companies • {pendingCompanies.length} pending approval
          </Typography>
        </Box>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Jobs Posted</TableCell>
              <TableCell>Joined Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companiesList.map(company => (
              <TableRow key={company.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{company.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {company.industry || 'Not specified'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{company.email}</Typography>
                    <Typography variant="body2" color="textSecondary">
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
                  <Typography variant="body2">
                    {jobs.filter(job => job.companyId === company.id).length}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(company.createdAt)}</TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleUserMenuOpen(e, company)}>
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabPanel>

      {/* Institutions Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Institution Accounts</Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setAddInstitutionOpen(true)}
          >
            Add Institution
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {institutionsList.map(institution => (
            <Grid item xs={12} md={6} key={institution.id}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <School />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{institution.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
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

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {institution.description || 'No description available.'}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Faculties:</strong> {faculties.filter(f => f.instituteId === institution.id).length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Courses:</strong> {courses.filter(c => {
                        const faculty = faculties.find(f => f.id === c.facultyId);
                        return faculty?.instituteId === institution.id;
                      }).length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Applications:</strong> {applications.filter(app => app.instituteId === institution.id).length}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    startIcon={<Visibility />}
                    onClick={() => handleViewInstitution(institution)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="error"
                    startIcon={<Delete />}
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
          <Typography variant="h5">Student Accounts</Typography>
          <Typography variant="body2" color="textSecondary">
            Total: {studentsList.length} students
          </Typography>
        </Box>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Academic Info</TableCell>
              <TableCell>Applications</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {studentsList.map(student => (
              <TableRow key={student.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{student.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {student.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      <strong>Field:</strong> {student.field || 'Not specified'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>GPA:</strong> {student.gpa || 'Not set'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {applications.filter(app => app.userId === student.id).length} applied
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={student.status || 'active'} 
                    color={getStatusColor(student.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(student.createdAt)}</TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleUserMenuOpen(e, student)}>
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabPanel>

      {/* Admins Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Administrator Accounts</Typography>
          <Typography variant="body2" color="textSecondary">
            Total: {adminsList.length} administrators
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {adminsList.map(admin => (
            <Grid item xs={12} md={6} lg={4} key={admin.id}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'error.main'
                }}>
                  <AdminPanelSettings sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {admin.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {admin.email}
                </Typography>
                <Chip 
                  label={admin.status || 'active'} 
                  color={getStatusColor(admin.status)}
                  sx={{ mt: 1 }}
                />
                <Typography variant="body2" sx={{ mt: 2 }}>
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
          <Typography variant="h5">Pending Company Approvals</Typography>
          <Typography variant="body2" color="textSecondary">
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
                <Card variant="outlined" sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <Business />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{company.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {company.industry || 'Industry not specified'}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {company.description || 'No description provided.'}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Email:</strong> {company.email}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {company.phone || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Location:</strong> {company.location || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Applied:</strong> {formatDate(company.createdAt)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => manageUserStatus(company.id, 'approve')}
                      sx={{ flex: 1 }}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<Block />}
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

      {/* System Reports Tab - FIXED to show generated reports */}
      <TabPanel value={tabValue} index={6}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">System Reports & Analytics</Typography>
          <Button 
            variant="contained" 
            startIcon={<Assessment />}
            onClick={generateSystemReport}
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
              <Typography variant="h6" gutterBottom>
                Generated Reports ({reports.length})
              </Typography>
            </Grid>
            {reports.map((report, index) => (
              <Grid item xs={12} md={6} key={report.id}>
                <Card sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">
                      System Report #{reports.length - index}
                    </Typography>
                    <Chip 
                      label={formatDate(report.generatedAt)} 
                      size="small" 
                      color="primary"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Generated by: {report.generatedByName || 'Administrator'}
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Total Users:</strong> {report.statistics?.totalUsers || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Applications:</strong> {report.statistics?.totalApplications || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Admission Rate:</strong> {report.statistics?.admissionRate || 0}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Active Jobs:</strong> {report.statistics?.totalJobs || 0}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<Visibility />}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<Download />}
                    >
                      Export PDF
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Add />
            <Typography variant="h6">Add New Institution</Typography>
          </Box>
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
            startIcon={<Add />}
          >
            Add Institution
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Faculty Dialog */}
      <Dialog open={addFacultyOpen} onClose={() => setAddFacultyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Class />
            <Typography variant="h6">Add New Faculty</Typography>
          </Box>
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
            startIcon={<Add />}
          >
            Add Faculty
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Course Dialog */}
      <Dialog open={addCourseOpen} onClose={() => setAddCourseOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School />
            <Typography variant="h6">Add New Course</Typography>
          </Box>
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
            startIcon={<Add />}
          >
            Add Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Publish Admissions Dialog */}
      <Dialog open={publishAdmissionsOpen} onClose={() => setPublishAdmissionsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Publish />
            <Typography variant="h6">Publish Admissions</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              This will publish admission results and notify all students. This action cannot be undone.
            </Alert>
            
            <TextField
              label="Academic Year"
              type="number"
              value={admissionSettings.academicYear}
              onChange={e => setAdmissionSettings({...admissionSettings, academicYear: e.target.value})}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Start Date"
              type="date"
              value={admissionSettings.startDate}
              onChange={e => setAdmissionSettings({...admissionSettings, startDate: e.target.value})}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={admissionSettings.endDate}
              onChange={e => setAdmissionSettings({...admissionSettings, endDate: e.target.value})}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Announcement Message"
              multiline
              rows={3}
              value={admissionSettings.announcement}
              onChange={e => setAdmissionSettings({...admissionSettings, announcement: e.target.value})}
              fullWidth
              margin="normal"
              placeholder="Important information about the admissions process..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishAdmissionsOpen(false)}>Cancel</Button>
          <Button 
            onClick={publishAdmissions}
            variant="contained"
            color="primary"
            startIcon={<Publish />}
          >
            Publish Admissions
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Actions Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => handleViewUser(selectedUser)}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        {selectedUser?.status === 'pending' && (
          <MenuItem onClick={() => manageUserStatus(selectedUser.id, 'approve')}>
            <ListItemIcon>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Approve</ListItemText>
          </MenuItem>
        )}
        
        {selectedUser?.status === 'active' && (
          <MenuItem onClick={() => manageUserStatus(selectedUser.id, 'suspend')}>
            <ListItemIcon>
              <Block fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Suspend</ListItemText>
          </MenuItem>
        )}
        
        {selectedUser?.status === 'suspended' && (
          <MenuItem onClick={() => manageUserStatus(selectedUser.id, 'activate')}>
            <ListItemIcon>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Activate</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => deleteUserAccount(selectedUser?.id)}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* View User Dialog */}
      <Dialog open={viewUserDialogOpen} onClose={() => setViewUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">User Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: getRoleColor(selectedUser.role) }}>
                  {getRoleIcon(selectedUser.role)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
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
                  <Typography variant="body2" color="textSecondary">
                    <strong>Phone:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {selectedUser.phone || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Location:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {selectedUser.location || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Joined:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedUser.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Last Active:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedUser.lastLogin) || 'Unknown'}
                  </Typography>
                </Grid>
                {selectedUser.role === 'student' && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Field:</strong>
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.field || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        <strong>GPA:</strong>
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.gpa || 'Not set'}
                      </Typography>
                    </Grid>
                  </>
                )}
                {selectedUser.role === 'company' && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Industry:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {selectedUser.industry || 'Not specified'}
                    </Typography>
                  </Grid>
                )}
                {selectedUser.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Description:</strong>
                    </Typography>
                    <Typography variant="body1">
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
          <Typography variant="h6">Institution Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedInstitution && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'success.main' }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedInstitution.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
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
                    <Typography variant="h6" gutterBottom>Contact Information</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn color="action" />
                        <Typography variant="body2">
                          <strong>Location:</strong> {selectedInstitution.location || 'Not specified'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone color="action" />
                        <Typography variant="body2">
                          <strong>Phone:</strong> {selectedInstitution.phone || 'Not provided'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email color="action" />
                        <Typography variant="body2">
                          <strong>Email:</strong> {selectedInstitution.email}
                        </Typography>
                      </Box>
                      {selectedInstitution.website && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business color="action" />
                          <Typography variant="body2">
                            <strong>Website:</strong> {selectedInstitution.website}
                          </Typography>
                        </Box>
                      )}
                      {selectedInstitution.establishedYear && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday color="action" />
                          <Typography variant="body2">
                            <strong>Established:</strong> {selectedInstitution.establishedYear}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Statistics</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Faculties:</strong> {faculties.filter(f => f.instituteId === selectedInstitution.id).length}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Courses:</strong> {courses.filter(c => {
                          const faculty = faculties.find(f => f.id === c.facultyId);
                          return faculty?.instituteId === selectedInstitution.id;
                        }).length}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Applications:</strong> {applications.filter(app => app.instituteId === selectedInstitution.id).length}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Joined:</strong> {formatDate(selectedInstitution.createdAt)}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                {selectedInstitution.description && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Description</Typography>
                      <Typography variant="body2">
                        {selectedInstitution.description}
                      </Typography>
                    </Card>
                  </Grid>
                )}

                {/* Associated Faculties */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Associated Faculties</Typography>
                    {faculties.filter(f => f.instituteId === selectedInstitution.id).length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
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
                                secondary={faculty.description || 'No description'}
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