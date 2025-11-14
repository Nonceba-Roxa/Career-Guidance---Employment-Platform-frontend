// src/components/StudentDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import {
  Container, Typography, Select, MenuItem, TextField, Button,
  Input, Paper, Box, Grid, Card, Chip,
  Avatar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, List, ListItem, ListItemText, ListItemIcon, Badge,
  CardContent, CardActions, Divider, IconButton, LinearProgress,
  Stepper, Step, StepLabel, StepContent, Accordion, AccordionSummary, AccordionDetails,
  Fab, SpeedDial, SpeedDialAction, SpeedDialIcon, Rating, Tooltip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy, 
  getDocs,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDoc,
  setDoc
} from 'firebase/firestore';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `student-tab-${index}`,
    'aria-controls': `student-tabpanel-${index}`,
  };
}

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const getFileIcon = (fileType) => {
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('image')) return 'IMG';
  if (fileType.includes('word') || fileType.includes('document')) return 'DOC';
  return 'FILE';
};

// Predefined high school subjects
const HIGH_SCHOOL_SUBJECTS = [
  'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'Economics', 'Business Studies',
  'Computer Science', 'Art', 'Music', 'Physical Education',
  'French', 'German', 'Spanish', 'Accounting', 'Statistics'
];

// Grade options including A*
const GRADE_OPTIONS = ['A*', 'A', 'B', 'C', 'D', 'E', 'F'];

// Grade to numeric mapping including A*
const GRADE_TO_NUMERIC = {
  'A*': 95,
  'A': 85,
  'B': 75,
  'C': 65,
  'D': 55,
  'E': 45,
  'F': 35
};

// Professional color palette: White, Gray, Green accents
const COLORS = {
  primary: '#2E7D32', // Green - primary accent
  secondary: '#4CAF50', // Light Green - secondary accent
  background: '#FFFFFF', // White - main background
  surface: '#F8F9FA', // Light Gray - cards/surface
  border: '#E0E0E0', // Border gray
  text: {
    primary: '#212121', // Dark Gray - main text
    secondary: '#757575', // Medium Gray - secondary text
    disabled: '#9E9E9E' // Light Gray - disabled text
  },
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3'
  }
};

const StudentDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // State declarations
  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Application states
  const [selectedInst, setSelectedInst] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyJobDialogOpen, setApplyJobDialogOpen] = useState(false);
  const [courseFilter, setCourseFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [admissionDecisionOpen, setAdmissionDecisionOpen] = useState(false);
  const [pendingAdmissionDecision, setPendingAdmissionDecision] = useState(null);
  const [jobDecisionOpen, setJobDecisionOpen] = useState(false);
  const [pendingJobDecision, setPendingJobDecision] = useState(null);

  // Profile states
  const [gpa, setGpa] = useState(profile?.gpa || '');
  const [field, setField] = useState(profile?.field || '');
  const [experience, setExperience] = useState(profile?.experience || '');
  const [skills, setSkills] = useState(profile?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin || '');
  const [highSchoolGrades, setHighSchoolGrades] = useState(profile?.highSchoolGrades || {});
  const [qualifications, setQualifications] = useState(profile?.qualifications || []);
  const [newQualification, setNewQualification] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [educationLevel, setEducationLevel] = useState(profile?.educationLevel || 'high_school');

  // Document upload states
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('transcript');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Profile update states
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileUpdateStatus, setProfileUpdateStatus] = useState('');
  const [profileUpdateMessage, setProfileUpdateMessage] = useState('');

  // Stats and analytics
  const [dashboardStats, setDashboardStats] = useState({
    totalApplications: 0,
    admissionRate: 0,
    avgMatchScore: 0,
    profileCompletion: 0,
    qualifiedJobs: 0,
    pendingApplications: 0
  });

  // Enhanced data fetching
  const fetchInstitutions = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'institute'));
      const snapshot = await getDocs(q);
      const institutionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(inst => inst.status !== 'inactive');
      
      setInstitutions(institutionsData);
    } catch (error) {
      console.error('Error loading institutions:', error);
      enqueueSnackbar('Error loading institutions', { variant: 'error' });
    }
  }, [user, enqueueSnackbar]);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'courses'));
      const snapshot = await getDocs(q);
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(course => course.status !== 'inactive');
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      enqueueSnackbar('Error loading courses', { variant: 'error' });
    }
  }, [user, enqueueSnackbar]);

  const fetchFaculties = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'faculties'));
      const snapshot = await getDocs(q);
      const facultiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(faculty => faculty.status !== 'inactive');
      
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error loading faculties:', error);
      enqueueSnackbar('Error loading faculties', { variant: 'error' });
    }
  }, [user, enqueueSnackbar]);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'jobs'));
      const snapshot = await getDocs(q);
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate?.() || new Date()
      }));
      
      const activeJobs = jobsData
        .filter(job => job.status === 'active')
        .sort((a, b) => {
          const dateA = a.postedAt || new Date(0);
          const dateB = b.postedAt || new Date(0);
          return dateB - dateA;
        });
      
      setJobs(activeJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      enqueueSnackbar('Error loading jobs: ' + error.message, { variant: 'error' });
    }
  }, [user, enqueueSnackbar]);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'applications'));
      const snapshot = await getDocs(q);
      
      const apps = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            appliedAt: data.appliedAt?.toDate?.() || new Date(),
            status: data.status || 'pending'
          };
        })
        .filter(app => app.userId === user.uid)
        .sort((a, b) => {
          const dateA = a.appliedAt || new Date(0);
          const dateB = b.appliedAt || new Date(0);
          return dateB - dateA;
        });
      
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
      enqueueSnackbar('Error loading applications: ' + error.message, { variant: 'error' });
      setApplications([]);
    }
  }, [user, enqueueSnackbar]);

  const fetchJobApplications = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'jobApplications'));
      const snapshot = await getDocs(q);
      
      const apps = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            appliedAt: data.appliedAt?.toDate?.() || new Date(),
            status: data.status || 'pending'
          };
        })
        .filter(app => app.userId === user.uid)
        .sort((a, b) => {
          const dateA = a.appliedAt || new Date(0);
          const dateB = b.appliedAt || new Date(0);
          return dateB - dateA;
        });
      
      setJobApplications(apps);
    } catch (error) {
      console.error('Error loading job applications:', error);
      setJobApplications([]);
    }
  }, [user]);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'documents'));
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            uploadedAt: data.uploadedAt?.toDate?.() || new Date()
          };
        })
        .filter(doc => doc.userId === user.uid)
        .sort((a, b) => {
          const dateA = a.uploadedAt || new Date(0);
          const dateB = b.uploadedAt || new Date(0);
          return dateB - dateA;
        });
      
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    }
  }, [user]);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'bookmarks'));
      const snapshot = await getDocs(q);
      
      const bookmarksData = snapshot.docs
        .map(doc => doc.data())
        .filter(bookmark => bookmark.userId === user.uid && bookmark.type === 'job');
      
      const bookmarkedJobIds = bookmarksData.map(bookmark => bookmark.itemId);
      
      setBookmarkedJobs(bookmarkedJobIds);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarkedJobs([]);
    }
  }, [user]);

// Add this enhanced notifications fetching function to your StudentDashboard component

// Enhanced notifications fetching with proper error handling
const fetchNotifications = useCallback(async () => {
  if (!user) return;
  
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date()
        }));
        
        console.log('Fetched notifications:', notificationsData.length);
        setNotifications(notificationsData);
        
        // Show snackbar for new unread notifications
        const newUnread = notificationsData.filter(n => !n.read && 
          new Date(n.timestamp) > new Date(Date.now() - 30000)); // Last 30 seconds
        
        newUnread.forEach(notification => {
          enqueueSnackbar(`${notification.title}: ${notification.message}`, {
            variant: 'info',
            autoHideDuration: 5000,
          });
        });
      },
      (error) => {
        console.error('Error in notifications listener:', error);
        // Fallback: try to fetch notifications once
        fetchNotificationsOnce();
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up notifications listener:', error);
    // Fallback: try to fetch notifications once
    fetchNotificationsOnce();
  }
}, [user, enqueueSnackbar]);

// Fallback function to fetch notifications once
const fetchNotificationsOnce = useCallback(async () => {
  if (!user) return;
  
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const notificationsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date()
    }));
    
    setNotifications(notificationsData);
    console.log('Fetched notifications (fallback):', notificationsData.length);
  } catch (error) {
    console.error('Error fetching notifications (fallback):', error);
    // Create sample notifications if none exist and collection might not exist yet
    createSampleNotifications();
  }
}, [user]);

// Enhanced function to create sample notifications
const createSampleNotifications = useCallback(async () => {
  if (!user) return;

  try {
    // Check if we already have notifications
    if (notifications.length > 0) return;

    const sampleNotifications = [
      {
        userId: user.uid,
        type: 'welcome',
        title: 'Welcome to Student Dashboard',
        message: 'Complete your profile to get better course and job recommendations',
        timestamp: serverTimestamp(),
        read: false,
        priority: 'medium'
      },
      {
        userId: user.uid,
        type: 'tip',
        title: 'Quick Tip',
        message: 'Upload your documents and complete your profile to improve your application chances',
        timestamp: serverTimestamp(),
        read: false,
        priority: 'low'
      }
    ];

    const createdNotifications = [];
    for (const notification of sampleNotifications) {
      const docRef = await addDoc(collection(db, 'notifications'), notification);
      createdNotifications.push({ id: docRef.id, ...notification });
    }

    if (createdNotifications.length > 0) {
      setNotifications(createdNotifications);
      console.log('Created sample notifications:', createdNotifications.length);
    }
  } catch (error) {
    console.error('Error creating sample notifications:', error);
    // Even if we can't create in Firestore, set some local sample notifications
    const localSampleNotifications = [
      {
        id: 'local-welcome-1',
        type: 'welcome',
        title: 'Welcome to Student Dashboard',
        message: 'Complete your profile to get better course and job recommendations',
        timestamp: new Date(),
        read: false,
        priority: 'medium'
      }
    ];
    setNotifications(localSampleNotifications);
  }
}, [user, notifications.length]);

// Enhanced mark as read function
const markNotificationRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    });
    console.log('Marked notification as read:', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // Fallback to local state update if Firestore update fails
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }
};

// Enhanced mark all as read
const markAllNotificationsRead = async () => {
  try {
    const batch = writeBatch(db);
    const unreadNotifications = notifications.filter(notif => !notif.read);
    
    unreadNotifications.forEach(notification => {
      if (notification.id && !notification.id.startsWith('local-')) {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { 
          read: true,
          readAt: serverTimestamp()
        });
      }
    });
    
    await batch.commit();
    enqueueSnackbar(`Marked ${unreadNotifications.length} notifications as read`, { variant: 'success' });
    
    // Update local state
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    // Fallback to local state update
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    enqueueSnackbar('Notifications marked as read locally', { variant: 'info' });
  }
};

// Enhanced clear all notifications
const clearAllNotifications = async () => {
  try {
    const batch = writeBatch(db);
    const notificationsToDelete = notifications.filter(notification => 
      notification.id && !notification.id.startsWith('local-')
    );
    
    notificationsToDelete.forEach(notification => {
      const notificationRef = doc(db, 'notifications', notification.id);
      batch.delete(notificationRef);
    });
    
    await batch.commit();
    enqueueSnackbar(`Cleared ${notificationsToDelete.length} notifications`, { variant: 'success' });
    
    // Clear local state
    setNotifications([]);
  } catch (error) {
    console.error('Error clearing notifications:', error);
    // Fallback to local state clear
    setNotifications([]);
    enqueueSnackbar('Notifications cleared locally', { variant: 'info' });
  }
};

// Function to create notification (useful for testing)
const createNotification = async (notificationData) => {
  try {
    const notification = {
      userId: user.uid,
      timestamp: serverTimestamp(),
      read: false,
      priority: 'medium',
      ...notificationData
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);
    console.log('Created notification:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Fallback to local notification
    const localNotification = {
      id: 'local-' + Date.now(),
      ...notificationData,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [localNotification, ...prev]);
    return localNotification.id;
  }
};

// Enhanced data loading
const fetchData = useCallback(async () => {
  if (!user) return;

  try {
    setLoading(true);
    console.log('Starting data fetch...');
    
    await Promise.all([
      fetchInstitutions(),
      fetchCourses(),
      fetchFaculties(),
      fetchJobs(),
      fetchApplications(),
      fetchJobApplications(),
      fetchDocuments(),
      fetchBookmarks(),
      fetchNotifications() // This will set up the real-time listener
    ]);
    
    console.log('Data fetch completed');
    
  } catch (error) {
    console.error('Fetch data error:', error);
    enqueueSnackbar('Error loading dashboard data', { variant: 'error' });
  } finally {
    setLoading(false);
  }
}, [
  user, 
  fetchInstitutions, 
  fetchCourses, 
  fetchFaculties, 
  fetchJobs, 
  fetchApplications, 
  fetchJobApplications, 
  fetchDocuments, 
  fetchBookmarks,
  fetchNotifications,
  enqueueSnackbar
]);
  // Calculate dashboard statistics
  const calculateDashboardStats = useCallback(() => {
    const totalApps = applications.length + jobApplications.length;
    
    const admittedCount = applications.filter(app => app.status === 'admitted').length;
    const admissionRate = applications.length > 0 ? (admittedCount / applications.length) * 100 : 0;
    
    const totalMatchScore = jobApplications.reduce((sum, app) => sum + (app.matchScore || 0), 0);
    const avgMatchScore = jobApplications.length > 0 ? totalMatchScore / jobApplications.length : 0;

    const qualifiedJobsCount = jobs.filter(job => calculateJobMatch(job) >= 50).length;

    const pendingApplicationsCount = applications.filter(app => app.status === 'pending').length;

    let profileCompletion = 0;
    if (profile) {
      const completionFields = [
        profile.gpa !== undefined && profile.gpa !== null && profile.gpa !== '',
        profile.field !== undefined && profile.field !== null && profile.field !== '',
        profile.skills !== undefined && profile.skills !== null && profile.skills.length > 0,
        profile.bio !== undefined && profile.bio !== null && profile.bio !== '',
        profile.phone !== undefined && profile.phone !== null && profile.phone !== '',
        profile.highSchoolGrades !== undefined && profile.highSchoolGrades !== null && Object.keys(profile.highSchoolGrades).length > 0
      ];
      const completedFields = completionFields.filter(Boolean).length;
      profileCompletion = (completedFields / completionFields.length) * 100;
    }

    const newStats = {
      totalApplications: totalApps,
      admissionRate: Math.round(admissionRate),
      avgMatchScore: Math.round(avgMatchScore),
      profileCompletion: Math.round(profileCompletion),
      qualifiedJobs: qualifiedJobsCount,
      pendingApplications: pendingApplicationsCount
    };

    setDashboardStats(newStats);
  }, [applications, jobApplications, documents, jobs, profile]);

  // Check for multiple admissions and prompt for decision
  const checkMultipleAdmissions = useCallback(() => {
    const admittedApplications = applications.filter(app => app.status === 'admitted' && !app.decisionMade);
    
    if (admittedApplications.length > 1) {
      setPendingAdmissionDecision(admittedApplications);
      setAdmissionDecisionOpen(true);
    }
  }, [applications]);

  // Check for job offers and prompt for decision
  const checkJobOffers = useCallback(() => {
    const jobOffers = jobApplications.filter(app => app.status === 'offered' && !app.decisionMade);
    
    if (jobOffers.length > 0) {
      setPendingJobDecision(jobOffers);
      setJobDecisionOpen(true);
    }
  }, [jobApplications]);

  // FIXED: Working admission decision handler with auto-delete for rejected applications
  const handleAdmissionDecision = async (selectedApplicationId) => {
    try {
      console.log('Processing admission decision for:', selectedApplicationId);
      
      if (!selectedApplicationId) {
        throw new Error('No application selected');
      }

      const admittedApplications = applications.filter(app => 
        app.status === 'admitted' && !app.decisionMade
      );

      if (admittedApplications.length === 0) {
        throw new Error('No admitted applications found');
      }

      // Update all applications individually
      for (const application of admittedApplications) {
        const applicationRef = doc(db, 'applications', application.id);
        
        if (application.id === selectedApplicationId) {
          // Selected application - confirm it
          await updateDoc(applicationRef, {
            decisionMade: true,
            finalChoice: true,
            decisionDate: serverTimestamp(),
            status: 'confirmed'
          });
          console.log(`Confirmed: ${application.courseName}`);
        } else {
          // Other applications - delete them from the system
          await deleteDoc(applicationRef);
          console.log(`Deleted: ${application.courseName}`);
        }
      }

      // Refresh applications data
      await fetchApplications();
      
      // Close dialog and reset state
      setAdmissionDecisionOpen(false);
      setPendingAdmissionDecision(null);
      
      enqueueSnackbar('Admission decision saved successfully! Rejected applications have been removed.', { variant: 'success' });
      
      // Add notification to Firestore
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: 'admission_decision',
        title: 'Decision Recorded',
        message: 'Your admission choice has been recorded successfully',
        timestamp: serverTimestamp(),
        read: false
      });

    } catch (error) {
      console.error('Error handling admission decision:', error);
      enqueueSnackbar(`Failed to save decision: ${error.message}`, { variant: 'error' });
    }
  };

  // Job decision handler with auto-delete for declined offers
  const handleJobDecision = async (jobAppId, accept) => {
    try {
      const jobAppRef = doc(db, 'jobApplications', jobAppId);
      
      if (accept) {
        // Accept the job offer
        await updateDoc(jobAppRef, {
          decisionMade: true,
          status: 'accepted',
          decisionDate: serverTimestamp()
        });

        // Delete all other pending job applications
        const otherJobApps = jobApplications.filter(app => 
          app.id !== jobAppId && app.status === 'pending'
        );

        for (const app of otherJobApps) {
          await deleteDoc(doc(db, 'jobApplications', app.id));
        }

        enqueueSnackbar('Job offer accepted! Other pending applications have been removed.', { variant: 'success' });
      } else {
        // Decline the job offer - delete it
        await deleteDoc(jobAppRef);
        enqueueSnackbar('Job offer declined and removed from your applications.', { variant: 'info' });
      }

      await fetchJobApplications();
      
      setJobDecisionOpen(false);
      setPendingJobDecision(null);
      
      // Add notification to Firestore
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: 'job_decision',
        title: `Job Offer ${accept ? 'Accepted' : 'Declined'}`,
        message: `You have ${accept ? 'accepted' : 'declined'} the job offer`,
        timestamp: serverTimestamp(),
        read: false
      });

    } catch (error) {
      console.error('Error handling job decision:', error);
      enqueueSnackbar(`Failed to save decision: ${error.message}`, { variant: 'error' });
    }
  };

  // Auto-apply for jobs when student completes education
  const autoApplyForJobs = useCallback(async () => {
    if (!user || !profile || educationLevel !== 'completed') return;

    try {
      const relevantJobs = jobs.filter(job => {
        // Only apply to jobs that match the student's field
        if (job.requirements?.field && profile.field) {
          return job.requirements.field.toLowerCase().includes(profile.field.toLowerCase()) ||
                 profile.field.toLowerCase().includes(job.requirements.field.toLowerCase());
        }
        return false;
      });

      const appliedJobIds = jobApplications.map(app => app.jobId);
      const jobsToApply = relevantJobs.filter(job => 
        !appliedJobIds.includes(job.id) && 
        calculateJobMatch(job) >= 70
      );

      for (const job of jobsToApply) {
        const applicationData = {
          userId: user.uid,
          studentName: profile?.name || user.displayName || 'Unknown Student',
          studentEmail: user.email,
          jobId: job.id,
          jobTitle: job.title,
          companyId: job.companyId,
          companyName: job.companyName,
          appliedAt: serverTimestamp(),
          status: 'pending',
          matchScore: calculateJobMatch(job),
          coverLetter: 'Auto-applied based on completed education profile',
          resume: documents.find(doc => doc.fileType === 'resume')?.id || null,
          autoApplied: true
        };

        await addDoc(collection(db, 'jobApplications'), applicationData);
      }

      if (jobsToApply.length > 0) {
        enqueueSnackbar(`Auto-applied to ${jobsToApply.length} relevant jobs`, { variant: 'info' });
        await fetchJobApplications();
      }
    } catch (error) {
      console.error('Error auto-applying for jobs:', error);
    }
  }, [user, profile, educationLevel, jobs, jobApplications, documents, enqueueSnackbar, fetchJobApplications]);

  // Initialize all data loaders
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Update stats when data changes
  useEffect(() => {
    calculateDashboardStats();
  }, [applications, jobApplications, documents, jobs, profile, calculateDashboardStats]);

  useEffect(() => {
    checkMultipleAdmissions();
    checkJobOffers();
  }, [applications, jobApplications, checkMultipleAdmissions, checkJobOffers]);

  // Auto-apply for jobs when education level changes to completed
  useEffect(() => {
    if (educationLevel === 'completed') {
      autoApplyForJobs();
    }
  }, [educationLevel, autoApplyForJobs]);

  // Initialize profile data when profile changes
  useEffect(() => {
    if (profile) {
      setGpa(profile.gpa || '');
      setField(profile.field || '');
      setExperience(profile.experience || '');
      setSkills(profile.skills || []);
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
      setLinkedin(profile.linkedin || '');
      setHighSchoolGrades(profile.highSchoolGrades || {});
      setQualifications(profile.qualifications || []);
      setEducationLevel(profile.educationLevel || 'high_school');
    }
  }, [profile]);

  // Enhanced course qualification check with letter grades including A*
  const checkCourseQualification = (course) => {
    if (!profile || !course.requirements) return true;
    
    const requirements = course.requirements;
    
    // Check GPA requirement
    if (requirements.minGPA && (profile.gpa === undefined || profile.gpa === null || profile.gpa < requirements.minGPA)) {
      return false;
    }
    
    // Check high school grades with letter grade conversion including A*
    if (requirements.minGrades && profile.highSchoolGrades) {
      for (const [subject, minGrade] of Object.entries(requirements.minGrades)) {
        const studentGrade = profile.highSchoolGrades[subject];
        if (studentGrade) {
          // Convert letter grade to numeric for comparison including A*
          const studentNumericGrade = GRADE_TO_NUMERIC[studentGrade] || 0;
          const minNumericGrade = GRADE_TO_NUMERIC[minGrade] || 0;
          
          if (studentNumericGrade < minNumericGrade) {
            return false;
          }
        }
      }
    }
    
    // Check field requirement
    if (requirements.requiredField && profile.field !== requirements.requiredField) {
      return false;
    }
    
    return true;
  };

  // Enhanced job match calculation - STRICTLY by field
  const calculateJobMatch = (job) => {
    if (!profile || !job) return 0;
    
    let matchScore = 0;
    let criteriaMatched = 0;
    let totalCriteria = 0;

    // Field match (60% - STRICT MATCH)
    if (job.requirements?.field && profile.field) {
      totalCriteria++;
      const jobField = job.requirements.field.toLowerCase();
      const userField = profile.field.toLowerCase();
      
      // Strict field matching
      if (userField.includes(jobField) || jobField.includes(userField)) {
        criteriaMatched++;
        matchScore += 60;
      }
    }

    // GPA match (20%)
    if (job.requirements?.minGPA) {
      totalCriteria++;
      if (profile.gpa && profile.gpa >= job.requirements.minGPA) {
        criteriaMatched++;
        matchScore += 20;
      }
    }

    // Experience match (10%)
    if (job.requirements?.minExperience) {
      totalCriteria++;
      if (profile.experience && profile.experience >= job.requirements.minExperience) {
        criteriaMatched++;
        matchScore += 10;
      }
    }

    // Skills match (10%)
    if (job.requirements?.skills && Array.isArray(job.requirements.skills)) {
      totalCriteria++;
      const userSkills = profile.skills || [];
      const matchedSkills = job.requirements.skills.filter(skill => 
        userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (matchedSkills.length > 0) {
        criteriaMatched++;
        matchScore += (matchedSkills.length / job.requirements.skills.length) * 10;
      }
    }

    return totalCriteria === 0 ? 0 : Math.min(100, Math.round(matchScore));
  };

  // Enhanced profile update
  const updateProfile = async () => {
    try {
      const gpaValue = gpa ? parseFloat(gpa) : null;
      if (gpa && (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4)) {
        setProfileUpdateStatus('error');
        setProfileUpdateMessage('Please enter a valid GPA between 0 and 4');
        return;
      }

      setUpdatingProfile(true);
      setProfileUpdateStatus('uploading');
      setProfileUpdateMessage('Updating profile...');

      const profileData = {
        gpa: gpaValue,
        field: field.trim(),
        experience: parseInt(experience) || 0,
        skills: skills,
        bio: bio.trim(),
        phone: phone.trim(),
        linkedin: linkedin.trim(),
        highSchoolGrades: highSchoolGrades,
        qualifications: qualifications,
        educationLevel: educationLevel,
        profileCompleted: true,
        lastUpdated: serverTimestamp()
      };

      // Update in Firestore
      await updateDoc(doc(db, 'users', user.uid), profileData);

      await refreshProfile();
      setProfileUpdateStatus('success');
      setProfileUpdateMessage('Profile updated successfully!');
      
      enqueueSnackbar('Profile updated successfully!', { variant: 'success' });

      setTimeout(() => {
        setProfileUpdateStatus('');
        setProfileUpdateMessage('');
      }, 3000);
    } catch (error) {
      setProfileUpdateStatus('error');
      setProfileUpdateMessage('Failed to update profile: ' + error.message);
      enqueueSnackbar('Failed to update profile: ' + error.message, { variant: 'error' });
      console.error('Profile update error:', error);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Add skill
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim()) && skills.length < 10) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
      enqueueSnackbar('Skill added!', { variant: 'success' });
    } else if (skills.length >= 10) {
      enqueueSnackbar('Maximum 10 skills allowed', { variant: 'warning' });
    }
  };

  // Remove skill
  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
    enqueueSnackbar('Skill removed', { variant: 'info' });
  };

  // Document upload
  const uploadDocument = async () => {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const fileExtension = file?.name?.toLowerCase().substring(file.name.lastIndexOf('.')) || '';
    
    if (!file || !user) {
      setUploadStatus('error');
      setUploadMessage('Please select a file to upload');
      setTimeout(() => {
        setUploadStatus('');
        setUploadMessage('');
      }, 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadMessage('File size must be less than 5MB for direct upload');
      setTimeout(() => {
        setUploadStatus('');
        setUploadMessage('');
      }, 3000);
      return;
    }

    if (!allowedExtensions.includes(fileExtension)) {
      setUploadStatus('error');
      setUploadMessage('Please select a PDF, JPG, PNG, or DOC file');
      setTimeout(() => {
        setUploadStatus('');
        setUploadMessage('');
      }, 3000);
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setUploadMessage('Converting file to base64...');
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const base64Data = await fileToBase64(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadMessage('Saving to database...');

      const uploadData = {
        userId: user.uid,
        fileData: base64Data,
        fileType: docType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: serverTimestamp(),
        status: 'uploaded',
        fileExtension: fileExtension
      };

      await addDoc(collection(db, 'documents'), uploadData);

      setUploadStatus('success');
      setUploadMessage(`${docType.charAt(0).toUpperCase() + docType.slice(1)} uploaded successfully!`);
      
      await fetchDocuments();
      
      enqueueSnackbar('Document uploaded successfully!', { variant: 'success' });

      setFile(null);
      setUploadProgress(0);
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';

      setTimeout(() => {
        setUploadStatus('');
        setUploadMessage('');
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadMessage(`Upload failed: ${error.message}`);
      enqueueSnackbar('Upload failed: ' + error.message, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const deleteDocument = async (document) => {
    if (!window.confirm(`Are you sure you want to delete "${document.fileName}"?`)) return;

    try {
      await deleteDoc(doc(db, 'documents', document.id));
      await fetchDocuments();
      enqueueSnackbar('Document deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting document:', error);
      enqueueSnackbar('Failed to delete document', { variant: 'error' });
    }
  };

  // Download document
  const downloadDocument = async (document) => {
    try {
      if (document.fileData) {
        const link = document.createElement('a');
        link.href = document.fileData;
        link.download = document.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        enqueueSnackbar('Document downloaded successfully', { variant: 'success' });
      } else {
        enqueueSnackbar('Document data not found', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      enqueueSnackbar('Failed to download document', { variant: 'error' });
    }
  };

  // View document
  const viewDocument = (document) => {
    if (document.fileData) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${document.fileName}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: Arial, sans-serif; 
                  background: #f5f5f5;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                .container { 
                  background: white; 
                  padding: 20px; 
                  border-radius: 8px; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  max-width: 90%;
                  max-height: 90vh;
                  overflow: auto;
                }
                img, .pdf-view { 
                  max-width: 100%; 
                  height: auto; 
                }
                .download-btn {
                  background: ${COLORS.primary};
                  color: white;
                  padding: 10px 20px;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  margin-top: 15px;
                }
                .download-btn:hover {
                  background: ${COLORS.secondary};
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h3>${document.fileName}</h3>
                <p><strong>Type:</strong> ${document.fileType} • <strong>Size:</strong> ${(document.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                ${document.mimeType?.includes('image') ? 
                  `<img src="${document.fileData}" alt="${document.fileName}" />` :
                  document.mimeType?.includes('pdf') ?
                  `<iframe src="${document.fileData}" width="100%" height="600px" style="border: none;"></iframe>` :
                  `<p>Preview not available for this file type. Please download to view.</p>`
                }
                <br/>
                <button class="download-btn" onclick="window.location.href='${document.fileData}'" download="${document.fileName}">
                  Download Document
                </button>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      enqueueSnackbar('Document data not found', { variant: 'error' });
    }
  };

  // Course application
  const applyCourse = async () => {
    if (!selectedCourse || !selectedInst) {
      enqueueSnackbar('Please select institution and course', { variant: 'error' });
      return;
    }

    const course = courses.find(c => c.id === selectedCourse);
    if (!course) {
      enqueueSnackbar('Selected course not found', { variant: 'error' });
      return;
    }

    if (!checkCourseQualification(course)) {
      enqueueSnackbar('You do not meet the requirements for this course', { variant: 'error' });
      return;
    }

    const institutionApplications = applications.filter(app => 
      app.instituteId === selectedInst
    );
    
    if (institutionApplications.length >= 2) {
      enqueueSnackbar('You can only apply to maximum 2 courses per institution', { variant: 'error' });
      return;
    }

    const alreadyApplied = applications.some(app => 
      app.courseId === selectedCourse && app.instituteId === selectedInst
    );
    
    if (alreadyApplied) {
      enqueueSnackbar('You have already applied to this course', { variant: 'error' });
      return;
    }

    try {
      const faculty = faculties.find(f => f.id === course.facultyId);
      const institution = institutions.find(inst => inst.id === selectedInst);

      const applicationData = {
        userId: user.uid,
        studentName: profile?.name || user.displayName || 'Unknown Student',
        studentEmail: user.email,
        courseId: selectedCourse,
        courseName: course.name,
        facultyId: course.facultyId,
        facultyName: faculty?.name || 'Unknown Faculty',
        instituteId: selectedInst,
        instituteName: institution?.name || 'Unknown Institution',
        appliedAt: serverTimestamp(),
        status: 'pending',
        decisionMade: false,
        finalChoice: false,
        gpa: profile?.gpa || 0,
        field: profile?.field || '',
        matchScore: calculateCourseMatch(course)
      };

      await addDoc(collection(db, 'applications'), applicationData);

      enqueueSnackbar('Application submitted successfully!', { variant: 'success' });
      
      await fetchApplications();
      
      setSelectedInst('');
      setSelectedCourse('');
      
    } catch (error) {
      console.error('Course application error:', error);
      enqueueSnackbar('Application failed: ' + error.message, { variant: 'error' });
    }
  };

  // Calculate course match percentage with letter grades including A*
  const calculateCourseMatch = (course) => {
    if (!profile || !course.requirements) return 50;
    
    let matchScore = 0;
    let criteriaMatched = 0;
    let totalCriteria = 0;

    if (course.requirements.minGPA) {
      totalCriteria++;
      if (profile.gpa >= course.requirements.minGPA) {
        criteriaMatched++;
        matchScore += 40;
      }
    }

    if (course.requirements.requiredField) {
      totalCriteria++;
      if (profile.field && profile.field.toLowerCase().includes(course.requirements.requiredField.toLowerCase())) {
        criteriaMatched++;
        matchScore += 40;
      }
    }

    if (course.requirements.minGrades && profile.highSchoolGrades) {
      totalCriteria++;
      let gradesMatch = true;
      for (const [subject, minGrade] of Object.entries(course.requirements.minGrades)) {
        const studentGrade = profile.highSchoolGrades[subject];
        if (studentGrade) {
          const studentNumericGrade = GRADE_TO_NUMERIC[studentGrade] || 0;
          const minNumericGrade = GRADE_TO_NUMERIC[minGrade] || 0;
          
          if (studentNumericGrade < minNumericGrade) {
            gradesMatch = false;
            break;
          }
        } else {
          gradesMatch = false;
          break;
        }
      }
      if (gradesMatch) {
        criteriaMatched++;
        matchScore += 20;
      }
    }

    return totalCriteria === 0 ? 50 : Math.min(100, Math.round(matchScore));
  };

  // Job application - ONLY ALLOW IF FIELD MATCHES
  const applyForJob = async (job) => {
    try {
      const matchScore = calculateJobMatch(job);

      // STRICT FIELD VALIDATION
      if (!profile?.field || !job.requirements?.field) {
        enqueueSnackbar('Cannot apply: Field information missing', { variant: 'error' });
        return;
      }

      const jobField = job.requirements.field.toLowerCase();
      const userField = profile.field.toLowerCase();
      
      // Strict field matching - only allow if fields match
      if (!userField.includes(jobField) && !jobField.includes(userField)) {
        enqueueSnackbar(`This job requires ${job.requirements.field} field. Your field is ${profile.field}`, { variant: 'error' });
        return;
      }

      if (matchScore < 50) {
        enqueueSnackbar('Your profile does not meet the minimum requirements for this job', { variant: 'warning' });
        return;
      }

      const alreadyApplied = jobApplications.some(app => app.jobId === job.id);
      if (alreadyApplied) {
        enqueueSnackbar('You have already applied to this job', { variant: 'warning' });
        return;
      }

      const applicationData = {
        userId: user.uid,
        studentName: profile?.name || user.displayName || 'Unknown Student',
        studentEmail: user.email,
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        appliedAt: serverTimestamp(),
        status: 'pending',
        matchScore: matchScore,
        coverLetter: '',
        resume: documents.find(doc => doc.fileType === 'resume')?.id || null
      };

      await addDoc(collection(db, 'jobApplications'), applicationData);

      enqueueSnackbar(`Job application submitted! Match score: ${matchScore}%`, { variant: 'success' });
      
      await fetchJobApplications();
      
      setApplyJobDialogOpen(false);
      setSelectedJob(null);
      
    } catch (error) {
      enqueueSnackbar('Failed to apply for job: ' + error.message, { variant: 'error' });
      console.error('Job application error:', error);
    }
  };

  // Bookmark functionality
  const toggleBookmark = async (job) => {
    try {
      const isBookmarked = bookmarkedJobs.includes(job.id);
      
      if (isBookmarked) {
        const q = query(collection(db, 'bookmarks'));
        const snapshot = await getDocs(q);
        
        const bookmarksToDelete = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(bookmark => 
            bookmark.userId === user.uid && 
            bookmark.type === 'job' && 
            bookmark.itemId === job.id
          );
        
        const deletePromises = bookmarksToDelete.map(bookmark => 
          deleteDoc(doc(db, 'bookmarks', bookmark.id))
        );
        await Promise.all(deletePromises);
        
        setBookmarkedJobs(prev => prev.filter(id => id !== job.id));
        enqueueSnackbar('Job removed from bookmarks', { variant: 'info' });
      } else {
        await addDoc(collection(db, 'bookmarks'), {
          userId: user.uid,
          type: 'job',
          itemId: job.id,
          itemData: job,
          createdAt: serverTimestamp()
        });
        
        setBookmarkedJobs(prev => [...prev, job.id]);
        enqueueSnackbar('Job bookmarked', { variant: 'success' });
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      enqueueSnackbar('Failed to update bookmark', { variant: 'error' });
    }
  };

  // Speed dial actions
  const speedDialActions = [
    { name: 'Quick Apply', action: () => setTabValue(1) },
    { name: 'Find Jobs', action: () => setTabValue(2) },
    { name: 'Upload Document', action: () => setTabValue(4) },
    { name: 'Update Profile', action: () => setTabValue(3) },
  ];

  // Filter courses by selected institution
  const filteredCourses = courses.filter(course => {
    if (!selectedInst) return false;
    const faculty = faculties.find(f => f.id === course.facultyId);
    return faculty?.instituteId === selectedInst;
  });

  // Filter courses by status
  const getFilteredCourses = () => {
    switch (courseFilter) {
      case 'applied':
        return courses.filter(course => 
          applications.some(app => app.courseId === course.id)
        );
      case 'available':
        return courses.filter(course => 
          !applications.some(app => app.courseId === course.id) && 
          checkCourseQualification(course)
        );
      case 'qualified':
        return courses.filter(course => checkCourseQualification(course));
      default:
        return courses;
    }
  };

  // Filter jobs - ONLY SHOW JOBS THAT MATCH STUDENT'S FIELD
  const getFilteredJobs = () => {
    let filtered = jobs;
    
    // First filter by field match
    if (profile?.field) {
      filtered = filtered.filter(job => {
        if (!job.requirements?.field) return false;
        const jobField = job.requirements.field.toLowerCase();
        const userField = profile.field.toLowerCase();
        return userField.includes(jobField) || jobField.includes(userField);
      });
    }
    
    // Then apply additional filters
    switch (jobFilter) {
      case 'high_match':
        filtered = filtered.filter(job => calculateJobMatch(job) >= 80);
        break;
      case 'qualified':
        filtered = filtered.filter(job => calculateJobMatch(job) >= 50);
        break;
      case 'bookmarked':
        filtered = filtered.filter(job => bookmarkedJobs.includes(job.id));
        break;
      case 'applied':
        filtered = filtered.filter(job => 
          jobApplications.some(app => app.jobId === job.id)
        );
        break;
    }
    
    return filtered;
  };

  // Check if student has applied to a job
  const hasAppliedToJob = (jobId) => {
    return jobApplications.some(app => app.jobId === jobId);
  };

  // Get application status for a course
  const getCourseApplicationStatus = (courseId) => {
    const application = applications.find(app => app.courseId === courseId);
    return application ? application.status : 'not_applied';
  };

  // Render star rating for match score
  const renderMatchStars = (score) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Rating value={score / 20} readOnly size="small" />
        <Typography variant="body2" color="text.secondary">
          {score}%
        </Typography>
      </Box>
    );
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'admitted': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      case 'rejected_by_student': return 'default';
      case 'offered': return 'success';
      case 'accepted': return 'success';
      case 'declined': return 'error';
      default: return 'default';
    }
  };

  // Add high school grade with predefined subjects and letter grades including A*
  const addHighSchoolGrade = () => {
    if (selectedSubject && grade) {
      setHighSchoolGrades(prev => ({
        ...prev,
        [selectedSubject]: grade
      }));
      setSelectedSubject('');
      setGrade('');
      enqueueSnackbar('Grade added successfully!', { variant: 'success' });
    } else {
      enqueueSnackbar('Please select a subject and grade', { variant: 'error' });
    }
  };

  // Remove high school grade
  const removeHighSchoolGrade = (subject) => {
    setHighSchoolGrades(prev => {
      const newGrades = { ...prev };
      delete newGrades[subject];
      return newGrades;
    });
    enqueueSnackbar('Grade removed', { variant: 'info' });
  };

  // Add qualification
  const addQualification = () => {
    if (newQualification.trim() && !qualifications.includes(newQualification.trim())) {
      setQualifications(prev => [...prev, newQualification.trim()]);
      setNewQualification('');
      enqueueSnackbar('Qualification added!', { variant: 'success' });
    }
  };

  // Remove qualification
  const removeQualification = (qualificationToRemove) => {
    setQualifications(prev => prev.filter(qualification => qualification !== qualificationToRemove));
    enqueueSnackbar('Qualification removed', { variant: 'info' });
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2, color: COLORS.primary }} />
          <Typography variant="h6" gutterBottom>Loading your dashboard...</Typography>
          <Typography variant="body2" color="text.secondary">
            Preparing your personalized student experience
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4, backgroundColor: COLORS.background, minHeight: '100vh' }}>
      {/* Header with Enhanced Stats */}
      <Paper sx={{ 
        p: 4, 
        mb: 3, 
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`, 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '2rem', md: '2.5rem' } }}>
                Student Dashboard
              </Typography>
              <Typography variant="h5" sx={{ mb: 1 }}>
                Welcome back, {profile?.name || 'Student'}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {profile?.field || 'No field specified'} • GPA: {profile?.gpa || 'Not set'} • {profile?.experience || 0} years experience
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Badge 
                badgeContent={notifications.filter(n => !n.read).length} 
                color="error"
                sx={{ 
                  '& .MuiBadge-badge': { 
                    fontSize: '0.8rem',
                    height: '20px',
                    minWidth: '20px'
                  } 
                }}
              >
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  N
                </Box>
              </Badge>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'rgba(255,255,255,0.2)',
                border: '3px solid rgba(255,255,255,0.3)',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}>
                {profile?.name?.charAt(0) || 'S'}
              </Avatar>
            </Box>
          </Box>

          {/* Enhanced Stats Grid */}
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.totalApplications}</Typography>
                <Typography variant="body2">Total Applications</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.admissionRate}%</Typography>
                <Typography variant="body2">Admission Rate</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.avgMatchScore}%</Typography>
                <Typography variant="body2">Avg Match Score</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.profileCompletion}%</Typography>
                <Typography variant="body2">Profile Complete</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.qualifiedJobs}</Typography>
                <Typography variant="body2">Qualified Jobs</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.pendingApplications}</Typography>
                <Typography variant="body2">Pending Applications</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{documents.length}</Typography>
                <Typography variant="body2">Documents</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Multiple Admission Decision Dialog */}
      <Dialog
        open={admissionDecisionOpen}
        onClose={() => setAdmissionDecisionOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" color="primary" sx={{ color: COLORS.primary }}>
            Multiple Admission Offers
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Congratulations! You have been admitted to multiple institutions. Please select one institution to attend:
          </Typography>

          <List>
            {pendingAdmissionDecision?.map((application) => (
              <ListItem key={application.id} divider sx={{ alignItems: "flex-start" }}>
                <ListItemIcon>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: `${COLORS.primary}20`, 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.primary,
                    fontWeight: 'bold'
                  }}>
                    C
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={application.courseName}
                  secondary={
                    <Box>
                      <Typography variant="body2">{application.instituteName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Applied: {formatDate(application.appliedAt)}
                      </Typography>
                    </Box>
                  }
                />
                <Button
                  variant="contained"
                  onClick={() => handleAdmissionDecision(application.id)}
                  sx={{ 
                    backgroundColor: COLORS.primary,
                    '&:hover': {
                      backgroundColor: COLORS.secondary,
                    }
                  }}
                >
                  SELECT THIS
                </Button>
              </ListItem>
            ))}
          </List>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> Selecting one institution will automatically remove other applications from the system.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setAdmissionDecisionOpen(false)}
            variant="outlined"
            sx={{ borderColor: COLORS.text.secondary, color: COLORS.text.secondary }}
          >
            Decide Later
          </Button>
        </DialogActions>
      </Dialog>

      {/* Job Offer Decision Dialog */}
      <Dialog
        open={jobDecisionOpen}
        onClose={() => setJobDecisionOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" color="primary" sx={{ color: COLORS.primary }}>
            Job Offer Received
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Congratulations! You have received a job offer. Please review and make your decision:
          </Typography>

          <List>
            {pendingJobDecision?.map((jobApp) => (
              <ListItem key={jobApp.id} divider sx={{ alignItems: "flex-start" }}>
                <ListItemIcon>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: `${COLORS.primary}20`, 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.primary,
                    fontWeight: 'bold'
                  }}>
                    J
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={jobApp.jobTitle}
                  secondary={
                    <Box>
                      <Typography variant="body2">{jobApp.companyName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Match Score: {jobApp.matchScore}%
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => handleJobDecision(jobApp.id, true)}
                    sx={{ 
                      backgroundColor: COLORS.primary,
                      '&:hover': {
                        backgroundColor: COLORS.secondary,
                      }
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleJobDecision(jobApp.id, false)}
                  >
                    Decline
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Accepting this offer will automatically remove other pending job applications.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setJobDecisionOpen(false)}
            variant="outlined"
            sx={{ borderColor: COLORS.text.secondary, color: COLORS.text.secondary }}
          >
            Decide Later
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content with Tabs */}
      <Paper sx={{ width: '100%', mb: 3, backgroundColor: COLORS.background }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            backgroundColor: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
            '& .MuiTab-root': {
              color: COLORS.text.secondary,
              '&.Mui-selected': {
                color: COLORS.primary,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: COLORS.primary,
            },
          }}
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label={`Courses (${courses.length})`} {...a11yProps(1)} />
          <Tab label={`Jobs (${getFilteredJobs().length})`} {...a11yProps(2)} />
          <Tab label="Profile" {...a11yProps(3)} />
          <Tab label={`Documents (${documents.length})`} {...a11yProps(4)} />
          <Tab 
            label={
              <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                Notifications
              </Badge>
            } 
            {...a11yProps(5)}
          />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Quick Stats & Progress */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, mb: 3, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Application Progress</Typography>
                <Stepper orientation="vertical">
                  <Step active={true} completed={dashboardStats.profileCompletion >= 50}>
                    <StepLabel>
                      <Typography variant="subtitle1" color={COLORS.text.primary}>Profile Completion</Typography>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={dashboardStats.profileCompletion} 
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" color={COLORS.text.primary}>{Math.round(dashboardStats.profileCompletion)}%</Typography>
                      </Box>
                    </StepContent>
                  </Step>
                  <Step active={applications.length > 0} completed={applications.some(app => app.status === 'admitted')}>
                    <StepLabel>
                      <Typography variant="subtitle1" color={COLORS.text.primary}>Course Applications</Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography color={COLORS.text.primary}>{applications.length} applications submitted</Typography>
                      {applications.some(app => app.status === 'admitted') && (
                        <Chip label="Admitted" color="success" size="small" sx={{ mt: 1 }} />
                      )}
                    </StepContent>
                  </Step>
                  <Step active={jobApplications.length > 0}>
                    <StepLabel>
                      <Typography variant="subtitle1" color={COLORS.text.primary}>Job Applications</Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography color={COLORS.text.primary}>{jobApplications.length} applications submitted</Typography>
                      <Typography variant="body2" color={COLORS.text.secondary}>
                        Average match score: {Math.round(dashboardStats.avgMatchScore)}%
                      </Typography>
                    </StepContent>
                  </Step>
                </Stepper>
              </Card>

              {/* Recent Activity */}
              <Card sx={{ p: 3, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Recent Activity</Typography>
                <List>
                  {[...applications, ...jobApplications]
                    .sort((a, b) => {
                      const dateA = a.appliedAt?.seconds ? new Date(a.appliedAt.seconds * 1000) : new Date(a.appliedAt);
                      const dateB = b.appliedAt?.seconds ? new Date(b.appliedAt.seconds * 1000) : new Date(b.appliedAt);
                      return dateB - dateA;
                    })
                    .slice(0, 5)
                    .map((item, index) => (
                      <ListItem key={index} divider={index < 4}>
                        <ListItemIcon>
                          <Box sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: item.jobId ? `${COLORS.primary}20` : `${COLORS.secondary}20`, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.jobId ? COLORS.primary : COLORS.secondary,
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}>
                            {item.jobId ? 'J' : 'C'}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography color={COLORS.text.primary}>{item.jobTitle || item.courseName}</Typography>}
                          secondary={
                            <Box>
                              <Typography variant="body2" color={COLORS.text.primary}>
                                {item.companyName || item.instituteName}
                              </Typography>
                              <Typography variant="caption" color={COLORS.text.secondary}>
                                Applied {formatDate(item.appliedAt)}
                              </Typography>
                              {item.matchScore && (
                                <Box sx={{ mt: 0.5 }}>
                                  {renderMatchStars(item.matchScore)}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <Chip 
                          label={item.status} 
                          size="small" 
                          color={getStatusColor(item.status)}
                        />
                      </ListItem>
                    ))}
                  
                  {applications.length === 0 && jobApplications.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary={<Typography color={COLORS.text.primary}>No recent activity</Typography>}
                        secondary="Start by applying to courses or jobs!"
                      />
                    </ListItem>
                  )}
                </List>
              </Card>
            </Grid>

            {/* Quick Actions & Recommendations */}
            <Grid item xs={12} md={4}>
              {/* Quick Actions */}
              <Card sx={{ p: 3, mb: 3, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Quick Actions</Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setTabValue(1)}
                      sx={{
                        height: 80,
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        borderColor: COLORS.primary,
                        color: COLORS.primary,
                        '&:hover': {
                          borderColor: COLORS.secondary,
                          backgroundColor: `${COLORS.primary}08`,
                        }
                      }}
                    >
                      <Box sx={{ fontSize: '1rem', mb: 1, fontWeight: 'bold' }}>C</Box>
                      Apply to Courses
                    </Button>
                  </Grid>

                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setTabValue(2)}
                      sx={{
                        height: 80,
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        borderColor: COLORS.primary,
                        color: COLORS.primary,
                        '&:hover': {
                          borderColor: COLORS.secondary,
                          backgroundColor: `${COLORS.primary}08`,
                        }
                      }}
                    >
                      <Box sx={{ fontSize: '1rem', mb: 1, fontWeight: 'bold' }}>J</Box>
                      Find Jobs
                    </Button>
                  </Grid>

                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setTabValue(4)}
                      sx={{
                        height: 80,
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        borderColor: COLORS.primary,
                        color: COLORS.primary,
                        '&:hover': {
                          borderColor: COLORS.secondary,
                          backgroundColor: `${COLORS.primary}08`,
                        }
                      }}
                    >
                      <Box sx={{ fontSize: '1rem', mb: 1, fontWeight: 'bold' }}>D</Box>
                      Upload Docs
                    </Button>
                  </Grid>

                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setTabValue(3)}
                      sx={{
                        height: 80,
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        borderColor: COLORS.primary,
                        color: COLORS.primary,
                        '&:hover': {
                          borderColor: COLORS.secondary,
                          backgroundColor: `${COLORS.primary}08`,
                        }
                      }}
                    >
                      <Box sx={{ fontSize: '1rem', mb: 1, fontWeight: 'bold' }}>P</Box>
                      Update Profile
                    </Button>
                  </Grid>
                </Grid>
              </Card>

              {/* Recommended Jobs */}
              <Card sx={{ p: 3, mb: 3, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Recommended Jobs</Typography>
                {getFilteredJobs()
                  .filter(job => calculateJobMatch(job) >= 75)
                  .slice(0, 3)
                  .map(job => (
                    <Card key={job.id} variant="outlined" sx={{ p: 2, mb: 2, cursor: 'pointer', borderColor: COLORS.border, backgroundColor: COLORS.background }}
                      onClick={() => {
                        setSelectedJob(job);
                        setApplyJobDialogOpen(true);
                      }}
                    >
                      <Typography fontWeight="bold" gutterBottom color={COLORS.text.primary}>{job.title}</Typography>
                      <Typography variant="body2" color={COLORS.text.secondary} gutterBottom>
                        {job.companyName}
                      </Typography>
                      {renderMatchStars(calculateJobMatch(job))}
                      <Button 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(job);
                        }}
                        sx={{ mt: 1, color: COLORS.primary }}
                      >
                        {bookmarkedJobs.includes(job.id) ? 'Saved' : 'Save'}
                      </Button>
                    </Card>
                  ))}
                {getFilteredJobs().filter(job => calculateJobMatch(job) >= 75).length === 0 && (
                  <Typography color={COLORS.text.secondary} textAlign="center" py={2}>
                    {jobs.length === 0 ? 'No jobs available yet' : 'Complete your profile for better recommendations'}
                  </Typography>
                )}
              </Card>

              {/* Profile Completion */}
              <Card sx={{ p: 3, background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`, color: 'white' }}>
                <Typography variant="h6" gutterBottom>
                  Profile Strength
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={dashboardStats.profileCompletion} 
                    size={60}
                    sx={{ color: 'white' }}
                  />
                  <Box>
                    <Typography variant="h4">{Math.round(dashboardStats.profileCompletion)}%</Typography>
                    <Typography variant="body2">
                      Complete
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => setTabValue(3)}
                  sx={{ 
                    background: 'rgba(255,255,255,0.2)',
                    '&:hover': { background: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  Improve Profile
                </Button>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Courses Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Course Applications</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                label={`All Courses (${courses.length})`}
                clickable
                color={courseFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setCourseFilter('all')}
              />
              <Chip
                label={`Available (${courses.filter(c => !applications.some(app => app.courseId === c.id) && checkCourseQualification(c)).length})`}
                clickable
                color={courseFilter === 'available' ? 'primary' : 'default'}
                onClick={() => setCourseFilter('available')}
              />
              <Chip
                label={`Applied (${applications.length})`}
                clickable
                color={courseFilter === 'applied' ? 'primary' : 'default'}
                onClick={() => setCourseFilter('applied')}
              />
              <Chip
                label={`Qualified (${courses.filter(c => checkCourseQualification(c)).length})`}
                clickable
                color={courseFilter === 'qualified' ? 'primary' : 'default'}
                onClick={() => setCourseFilter('qualified')}
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Course Application Form */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, position: 'sticky', top: 100, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary }}>Apply for New Course</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Select
                    value={selectedInst}
                    onChange={e => {
                      setSelectedInst(e.target.value);
                      setSelectedCourse('');
                    }}
                    displayEmpty
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="">Select Institution</MenuItem>
                    {institutions.map(inst => (
                      <MenuItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Select
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                    displayEmpty
                    fullWidth
                    disabled={!selectedInst}
                    size="small"
                  >
                    <MenuItem value="">Select Course</MenuItem>
                    {filteredCourses.map(course => (
                      <MenuItem 
                        key={course.id} 
                        value={course.id}
                        disabled={!checkCourseQualification(course)}
                      >
                        {course.name}
                        {!checkCourseQualification(course) && ' (Not Qualified)'}
                      </MenuItem>
                    ))}
                  </Select>
                  <Button
                    variant="contained"
                    onClick={applyCourse}
                    disabled={!selectedCourse || !selectedInst}
                    size="large"
                    sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.secondary } }}
                  >
                    Apply for Course
                  </Button>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Note:</strong> Maximum 2 courses per institution
                    </Typography>
                  </Alert>
                </Box>

                {/* Application Status */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary }}>Your Applications ({applications.length})</Typography>
                  {applications.length > 0 ? (
                    <List dense>
                      {applications.map((application) => (
                        <ListItem key={application.id} divider>
                          <ListItemIcon>
                            <Box sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: `${getStatusColor(application.status) === 'success' ? COLORS.status.success : getStatusColor(application.status) === 'warning' ? COLORS.status.warning : COLORS.status.error}20`, 
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: getStatusColor(application.status) === 'success' ? COLORS.status.success : getStatusColor(application.status) === 'warning' ? COLORS.status.warning : COLORS.status.error,
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}>
                              C
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography color={COLORS.text.primary}>{application.courseName || 'Unknown Course'}</Typography>}
                            secondary={
                              <Box>
                                <Typography variant="body2" color={COLORS.text.primary}>{application.instituteName || 'Unknown Institution'}</Typography>
                                <Typography variant="caption" display="block" color={COLORS.text.secondary}>
                                  Applied: {formatDate(application.appliedAt)}
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                  <Chip
                                    label={application.status?.toUpperCase() || 'PENDING'}
                                    size="small"
                                    color={getStatusColor(application.status)}
                                  />
                                  {application.finalChoice && (
                                    <Chip
                                      label="FINAL CHOICE"
                                      size="small"
                                      color="success"
                                      sx={{ ml: 0.5 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Box sx={{ fontSize: '2rem', color: COLORS.text.disabled, mb: 1, fontWeight: 'bold' }}>C</Box>
                      <Typography color={COLORS.text.secondary}>
                        No applications yet
                      </Typography>
                      <Typography variant="body2" color={COLORS.text.secondary}>
                        Apply to courses using the form above
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>

            {/* Available Courses */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary }}>
                Available Courses ({getFilteredCourses().length})
              </Typography>
              
              {getFilteredCourses().length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                  <Box sx={{ fontSize: '3rem', color: COLORS.text.disabled, mb: 2, fontWeight: 'bold' }}>C</Box>
                  <Typography variant="h6" color={COLORS.text.secondary} gutterBottom>
                    No courses found
                  </Typography>
                  <Typography variant="body2" color={COLORS.text.secondary}>
                    {courseFilter === 'applied' 
                      ? "You haven't applied to any courses yet."
                      : courseFilter === 'qualified'
                      ? "No courses match your qualifications."
                      : "No courses match your current filters."
                    }
                  </Typography>
                </Card>
              ) : (
                <Grid container spacing={2}>
                  {getFilteredCourses().map(course => {
                    const applicationStatus = getCourseApplicationStatus(course.id);
                    const faculty = faculties.find(f => f.id === course.facultyId);
                    const institution = institutions.find(inst => inst.id === faculty?.instituteId);
                    const institutionApplications = applications.filter(app => 
                      app.instituteId === institution?.id
                    );
                    const isQualified = checkCourseQualification(course);

                    return (
                      <Grid item xs={12} key={course.id}>
                        <Card variant="outlined" sx={{ 
                          p: 2, 
                          transition: 'all 0.2s', 
                          backgroundColor: COLORS.surface,
                          '&:hover': { boxShadow: 2 },
                          borderColor: !isQualified ? COLORS.status.error : COLORS.border
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography fontWeight="bold" gutterBottom variant="h6" color={COLORS.text.primary}>
                                  {course.name}
                                </Typography>
                                {!isQualified && (
                                  <Chip 
                                    label="Not Qualified" 
                                    size="small" 
                                    color="error" 
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color={COLORS.text.secondary} gutterBottom>
                                {institution?.name} • {faculty?.name}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 2 }} color={COLORS.text.primary}>
                                {course.description || 'No description available.'}
                              </Typography>
                              
                              {/* Course Requirements */}
                              {course.requirements && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" fontWeight="bold" gutterBottom color={COLORS.text.primary}>
                                    Requirements:
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {course.requirements.minGPA && (
                                      <Chip 
                                        label={`Min GPA: ${course.requirements.minGPA}`} 
                                        size="small" 
                                        variant="outlined"
                                        color={profile?.gpa >= course.requirements.minGPA ? 'success' : 'error'}
                                      />
                                    )}
                                    {course.requirements.requiredField && (
                                      <Chip 
                                        label={`Field: ${course.requirements.requiredField}`} 
                                        size="small" 
                                        variant="outlined"
                                        color={profile?.field === course.requirements.requiredField ? 'success' : 'error'}
                                      />
                                    )}
                                    {course.duration && (
                                      <Chip 
                                        label={`Duration: ${course.duration}`} 
                                        size="small" 
                                        variant="outlined"
                                      />
                                    )}
                                    {course.fees && (
                                      <Chip 
                                        label={`Fees: ${course.fees}`} 
                                        size="small" 
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                              {applicationStatus !== 'not_applied' ? (
                                <Chip
                                  label={applicationStatus.toUpperCase()}
                                  color={getStatusColor(applicationStatus)}
                                  sx={{ mb: 1 }}
                                />
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => {
                                    setSelectedInst(institution?.id);
                                    setSelectedCourse(course.id);
                                  }}
                                  disabled={institutionApplications.length >= 2 || !isQualified}
                                  sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.secondary } }}
                                >
                                  Apply
                                </Button>
                              )}
                              {institutionApplications.length >= 2 && applicationStatus === 'not_applied' && (
                                <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                                  Max applications reached
                                </Typography>
                              )}
                              {!isQualified && (
                                <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                                  Does not meet requirements
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Jobs Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Job Opportunities</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                label={`All Jobs (${getFilteredJobs().length})`}
                clickable
                color={jobFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setJobFilter('all')}
              />
              <Chip
                label="High Match"
                clickable
                color={jobFilter === 'high_match' ? 'primary' : 'default'}
                onClick={() => setJobFilter('high_match')}
              />
              <Chip
                label={`Qualified (${getFilteredJobs().filter(job => calculateJobMatch(job) >= 50).length})`}
                clickable
                color={jobFilter === 'qualified' ? 'primary' : 'default'}
                onClick={() => setJobFilter('qualified')}
              />
              <Chip
                label={`Saved (${bookmarkedJobs.length})`}
                clickable
                color={jobFilter === 'bookmarked' ? 'primary' : 'default'}
                onClick={() => setJobFilter('bookmarked')}
              />
              <Chip
                label={`Applied (${jobApplications.length})`}
                clickable
                color={jobFilter === 'applied' ? 'primary' : 'default'}
                onClick={() => setJobFilter('applied')}
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            {getFilteredJobs().length === 0 ? (
              <Grid item xs={12}>
                <Card sx={{ p: 4, textAlign: 'center', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                  <Box sx={{ fontSize: '3rem', color: COLORS.text.disabled, mb: 2, fontWeight: 'bold' }}>J</Box>
                  <Typography variant="h6" color={COLORS.text.secondary} gutterBottom>
                    {jobs.length === 0 ? 'No jobs available yet' : 'No jobs match your field and qualifications'}
                  </Typography>
                  <Typography variant="body2" color={COLORS.text.secondary}>
                    {jobs.length === 0 
                      ? "Check back later for new job opportunities!"
                      : "Jobs are filtered to match your field of study. Update your profile if needed."
                    }
                  </Typography>
                  {jobs.length === 0 && (
                    <Button 
                      variant="contained" 
                      sx={{ mt: 2, backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.secondary } }}
                      onClick={() => fetchJobs()}
                    >
                      Refresh Jobs
                    </Button>
                  )}
                </Card>
              </Grid>
            ) : (
              getFilteredJobs().map(job => {
                const matchScore = calculateJobMatch(job);
                const hasApplied = hasAppliedToJob(job.id);
                const isBookmarked = bookmarkedJobs.includes(job.id);
                const isQualified = matchScore >= 50;

                return (
                  <Grid item xs={12} md={6} key={job.id}>
                    <Card variant="outlined" sx={{ 
                      p: 2, 
                      height: '100%',
                      position: 'relative',
                      transition: 'all 0.2s',
                      backgroundColor: COLORS.surface,
                      borderColor: !isQualified ? COLORS.status.warning : COLORS.border,
                      '&:hover': { 
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      {/* Application Status Badge */}
                      {hasApplied && (
                        <Chip
                          label="Applied"
                          color="success"
                          size="small"
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        />
                      )}

                      {/* Qualification Warning */}
                      {!isQualified && (
                        <Chip
                          label="Not Qualified"
                          color="warning"
                          size="small"
                          sx={{ position: 'absolute', top: 8, right: hasApplied ? 80 : 8 }}
                        />
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight="bold" gutterBottom variant="h6" color={COLORS.text.primary}>
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color={COLORS.text.secondary} gutterBottom>
                            {job.companyName} • {job.location}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => toggleBookmark(job)}
                          color={isBookmarked ? 'primary' : 'default'}
                        >
                          {isBookmarked ? '★' : '☆'}
                        </IconButton>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2, color: COLORS.text.primary }}>
                        {job.description || 'No description available.'}
                      </Typography>

                      {/* Match Score */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom color={COLORS.text.primary}>
                          Your Match:
                        </Typography>
                        {renderMatchStars(matchScore)}
                      </Box>

                      {/* Requirements Chips */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {job.requirements?.minGPA && (
                          <Chip 
                            label={`GPA: ${job.requirements.minGPA}+`} 
                            size="small" 
                            variant="outlined"
                            color={profile?.gpa >= job.requirements.minGPA ? 'success' : 'error'}
                          />
                        )}
                        {job.requirements?.field && (
                          <Chip 
                            label={`Field: ${job.requirements.field}`} 
                            size="small" 
                            variant="outlined"
                            color={
                              profile?.field && profile.field.toLowerCase().includes(job.requirements.field.toLowerCase()) 
                                ? 'success' : 'error'
                            }
                          />
                        )}
                        {job.requirements?.minExperience > 0 && (
                          <Chip 
                            label={`Exp: ${job.requirements.minExperience}y+`} 
                            size="small" 
                            variant="outlined"
                            color={profile?.experience >= job.requirements.minExperience ? 'success' : 'error'}
                          />
                        )}
                        {job.salary && (
                          <Chip 
                            label={job.salary} 
                            size="small" 
                            color="primary"
                          />
                        )}
                      </Box>

                      <Button
                        variant="contained"
                        onClick={() => {
                          setSelectedJob(job);
                          setApplyJobDialogOpen(true);
                        }}
                        disabled={hasApplied || !isQualified}
                        fullWidth
                        size="large"
                        sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.secondary } }}
                      >
                        {hasApplied ? 'Applied' : !isQualified ? 'Not Qualified' : 'Apply Now'}
                      </Button>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="h5" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Profile Management</Typography>
                
                {profileUpdateStatus && (
                  <Alert
                    severity={profileUpdateStatus === 'success' ? 'success' : profileUpdateStatus === 'error' ? 'error' : 'info'}
                    sx={{ mb: 3 }}
                  >
                    {profileUpdateMessage}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="GPA (0-4.0)"
                      type="number"
                      value={gpa}
                      onChange={e => setGpa(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0, max: 4, step: 0.1 }}
                      error={gpa && (gpa < 0 || gpa > 4)}
                      helperText={gpa && (gpa < 0 || gpa > 4) ? "GPA must be between 0 and 4" : ""}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Field of Study"
                      value={field}
                      onChange={e => setField(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Experience (years)"
                      type="number"
                      value={experience}
                      onChange={e => setExperience(e.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  
                  {/* Education Level */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color={COLORS.text.primary}>Education Status</Typography>
                    <Select
                      value={educationLevel}
                      onChange={e => setEducationLevel(e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="high_school">High School Student</MenuItem>
                      <MenuItem value="undergraduate">Undergraduate Student</MenuItem>
                      <MenuItem value="graduate">Graduate Student</MenuItem>
                      <MenuItem value="completed">Completed Education</MenuItem>
                    </Select>
                    <Typography variant="caption" color={COLORS.text.secondary} sx={{ mt: 1 }}>
                      {educationLevel === 'completed' 
                        ? 'System will auto-apply to relevant jobs' 
                        : 'Update when you complete your education to enable auto-job applications'
                      }
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="LinkedIn Profile"
                      value={linkedin}
                      onChange={e => setLinkedin(e.target.value)}
                      fullWidth
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Bio"
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Tell us about yourself, your interests, and career goals..."
                    />
                  </Grid>
                  
                  {/* High School Grades with Subject Selection and Letter Grades including A* */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color={COLORS.text.primary}>High School Grades</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {Object.entries(highSchoolGrades).map(([subject, grade]) => (
                        <Chip
                          key={subject}
                          label={`${subject}: ${grade}`}
                          onDelete={() => removeHighSchoolGrade(subject)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      {Object.keys(highSchoolGrades).length === 0 && (
                        <Typography variant="body2" color={COLORS.text.secondary}>
                          No grades added yet
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Select
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                        displayEmpty
                        size="small"
                        sx={{ minWidth: 150 }}
                      >
                        <MenuItem value="">Select Subject</MenuItem>
                        {HIGH_SCHOOL_SUBJECTS.map(subject => (
                          <MenuItem key={subject} value={subject}>
                            {subject}
                          </MenuItem>
                        ))}
                      </Select>
                      <Select
                        value={grade}
                        onChange={e => setGrade(e.target.value)}
                        displayEmpty
                        size="small"
                        sx={{ minWidth: 100 }}
                      >
                        <MenuItem value="">Select Grade</MenuItem>
                        {GRADE_OPTIONS.map(gradeOption => (
                          <MenuItem key={gradeOption} value={gradeOption}>
                            {gradeOption}
                          </MenuItem>
                        ))}
                      </Select>
                      <Button 
                        variant="outlined" 
                        onClick={addHighSchoolGrade}
                        disabled={!selectedSubject || !grade}
                        sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
                      >
                        Add Grade
                      </Button>
                    </Box>
                    <Typography variant="caption" color={COLORS.text.secondary} sx={{ mt: 1 }}>
                      Grades are stored as letters (A*, A, B, C, D, E, F)
                    </Typography>
                  </Grid>
                  
                  {/* Qualifications */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color={COLORS.text.primary}>Additional Qualifications</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {qualifications.map((qualification, index) => (
                        <Chip
                          key={index}
                          label={qualification}
                          onDelete={() => removeQualification(qualification)}
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                      {qualifications.length === 0 && (
                        <Typography variant="body2" color={COLORS.text.secondary}>
                          No qualifications added yet
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        value={newQualification}
                        onChange={e => setNewQualification(e.target.value)}
                        placeholder="Add a qualification"
                        size="small"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addQualification();
                          }
                        }}
                      />
                      <Button 
                        variant="outlined" 
                        onClick={addQualification}
                        disabled={!newQualification.trim()}
                        sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
                      >
                        Add
                      </Button>
                    </Box>
                  </Grid>

                  {/* Skills Section */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color={COLORS.text.primary}>Skills</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          onDelete={() => removeSkill(skill)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      {skills.length === 0 && (
                        <Typography variant="body2" color={COLORS.text.secondary}>
                          No skills added yet
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        size="small"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill();
                          }
                        }}
                      />
                      <Button 
                        variant="outlined" 
                        onClick={addSkill}
                        disabled={!newSkill.trim() || skills.length >= 10}
                        sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
                      >
                        Add
                      </Button>
                    </Box>
                    <Typography variant="caption" color={COLORS.text.secondary} sx={{ mt: 1 }}>
                      {10 - skills.length} skills remaining
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={updateProfile}
                    disabled={updatingProfile || (gpa && (gpa < 0 || gpa > 4))}
                    startIcon={updatingProfile ? <CircularProgress size={20} /> : null}
                    size="large"
                    sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.secondary } }}
                  >
                    {updatingProfile ? 'Updating...' : 'Update Profile'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setGpa(profile?.gpa || '');
                      setField(profile?.field || '');
                      setExperience(profile?.experience || '');
                      setSkills(profile?.skills || []);
                      setBio(profile?.bio || '');
                      setPhone(profile?.phone || '');
                      setLinkedin(profile?.linkedin || '');
                      setHighSchoolGrades(profile?.highSchoolGrades || {});
                      setQualifications(profile?.qualifications || []);
                      setEducationLevel(profile?.educationLevel || 'high_school');
                    }}
                    sx={{ borderColor: COLORS.text.secondary, color: COLORS.text.secondary }}
                  >
                    Reset
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Profile Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <Avatar sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: COLORS.primary,
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}>
                  {profile?.name?.charAt(0) || 'S'}
                </Avatar>
                <Typography variant="h6" gutterBottom color={COLORS.text.primary}>
                  {profile?.name || 'Student'}
                </Typography>
                <Typography variant="body2" color={COLORS.text.secondary} gutterBottom>
                  {profile?.email}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" gutterBottom color={COLORS.text.primary}>
                    <strong>Field:</strong> {profile?.field || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" gutterBottom color={COLORS.text.primary}>
                    <strong>GPA:</strong> {profile?.gpa || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" gutterBottom color={COLORS.text.primary}>
                    <strong>Experience:</strong> {profile?.experience || 0} years
                  </Typography>
                  <Typography variant="body2" gutterBottom color={COLORS.text.primary}>
                    <strong>Education:</strong> {educationLevel?.replace('_', ' ') || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" gutterBottom color={COLORS.text.primary}>
                    <strong>Skills:</strong> {skills.length} added
                  </Typography>
                  <Typography variant="body2" gutterBottom color={COLORS.text.primary}>
                    <strong>Qualifications:</strong> {qualifications.length} added
                  </Typography>
                  <Typography variant="body2" color={COLORS.text.primary}>
                    <strong>High School Grades:</strong> {Object.keys(highSchoolGrades).length} subjects
                  </Typography>
                </Box>

                <Box sx={{ mt: 3, p: 2, bgcolor: `${COLORS.primary}08`, borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom color={COLORS.text.primary}>
                    Profile Strength
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={dashboardStats.profileCompletion} 
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color={COLORS.text.secondary}>
                    {Math.round(dashboardStats.profileCompletion)}% Complete
                  </Typography>
                </Box>
              </Card>

              {/* Quick Tips */}
              <Card sx={{ p: 3, mt: 3, backgroundColor: `${COLORS.primary}08`, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary }}>Profile Tips</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Complete all fields for better job matches" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Add relevant skills to stand out" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Keep your GPA and grades updated" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Include high school grades for course eligibility" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Set education to 'Completed' to auto-apply for jobs" />
                  </ListItem>
                </List>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="h5" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Upload Documents</Typography>
                
                {/* Upload Status */}
                {uploadStatus && (
                  <Alert
                    severity={uploadStatus === 'success' ? 'success' : uploadStatus === 'error' ? 'error' : 'info'}
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {uploadMessage}
                      </Typography>
                      {uploadStatus === 'uploading' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={uploadProgress} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {Math.round(uploadProgress)}% processed
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Alert>
                )}

                {/* Upload Tips */}
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> Files are stored directly in Firestore as base64 data.
                    Maximum file size: 5MB. Supported: PDF, JPG, PNG, DOC, DOCX
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="transcript">Academic Transcript</MenuItem>
                    <MenuItem value="certificate">Certificate</MenuItem>
                    <MenuItem value="resume">Resume/CV</MenuItem>
                    <MenuItem value="cover_letter">Cover Letter</MenuItem>
                    <MenuItem value="portfolio">Portfolio</MenuItem>
                    <MenuItem value="high_school_certificate">High School Certificate</MenuItem>
                    <MenuItem value="degree_certificate">Degree Certificate</MenuItem>
                    <MenuItem value="photo">Profile Photo</MenuItem>
                    <MenuItem value="other">Other Document</MenuItem>
                  </Select>
                  
                  {/* File Upload Area */}
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: file ? COLORS.primary : COLORS.border,
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 2,
                      cursor: uploading ? 'default' : 'pointer',
                      backgroundColor: file ? `${COLORS.primary}04` : COLORS.surface,
                      transition: 'all 0.2s',
                      '&:hover': !uploading ? { 
                        backgroundColor: file ? `${COLORS.primary}08` : `${COLORS.primary}04`,
                        borderColor: COLORS.primary
                      } : {},
                      opacity: uploading ? 0.7 : 1
                    }}
                    onClick={() => !uploading && document.getElementById('file-upload').click()}
                  >
                    <Box sx={{ 
                      fontSize: '3rem', 
                      color: file ? COLORS.primary : COLORS.text.disabled, 
                      mb: 2,
                      opacity: uploading ? 0.5 : 1,
                      fontWeight: 'bold'
                    }}>
                      U
                    </Box>
                    <Typography variant="h6" gutterBottom color={file ? COLORS.primary : COLORS.text.primary}>
                      {file ? 'File Selected' : 'Click to select a file'}
                    </Typography>
                    <Typography variant="body2" color={COLORS.text.secondary} sx={{ mb: 2 }}>
                      {uploading ? 'Processing file...' : 'Supports: PDF, JPG, PNG, DOC, DOCX (Max 5MB)'}
                    </Typography>
                    
                    <Input
                      type="file"
                      onChange={(e) => {
                        const selectedFile = e.target.files[0];
                        if (selectedFile) {
                          setFile(selectedFile);
                          setUploadStatus('');
                          setUploadMessage('');
                          setUploadProgress(0);
                        }
                      }}
                      inputProps={{ 
                        accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', 
                        multiple: false 
                      }}
                      sx={{ display: 'none' }}
                      id="file-upload"
                      disabled={uploading}
                    />
                    
                    {file && !uploading && (
                      <Box sx={{ mt: 2, p: 2, backgroundColor: COLORS.background, borderRadius: 1, border: '1px solid', borderColor: `${COLORS.primary}30` }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: COLORS.primary }}>
                          {getFileIcon(file.type)} {file.name}
                        </Typography>
                        <Typography variant="body2" color={COLORS.text.secondary}>
                          Size: {(file.size / 1024 / 1024).toFixed(2)} MB • Type: {file.type || 'Unknown'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Button
                    variant="contained"
                    onClick={uploadDocument}
                    disabled={!file || uploading}
                    startIcon={uploading ? <CircularProgress size={20} /> : null}
                    size="large"
                    sx={{ mt: 2, backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.secondary } }}
                  >
                    {uploading ? `Processing... (${Math.round(uploadProgress)}%)` : `Upload ${docType.charAt(0).toUpperCase() + docType.slice(1)}`}
                  </Button>

                  {uploading && (
                    <Typography variant="caption" color={COLORS.text.secondary} textAlign="center">
                      Converting file to base64 and saving to database...
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <Typography variant="h5" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>Your Documents ({documents.length})</Typography>
                {documents.length > 0 ? (
                  <List>
                    {documents.map((doc) => (
                      <ListItem key={doc.id} divider>
                        <ListItemIcon>
                          <Box sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: `${COLORS.primary}20`, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: COLORS.primary,
                            fontSize: '1rem',
                            fontWeight: 'bold'
                          }}>
                            {getFileIcon(doc.mimeType)}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography color={COLORS.text.primary}>{doc.fileName}</Typography>}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block" color={COLORS.text.secondary}>
                                Type: {doc.fileType} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                              <Typography variant="caption" color={COLORS.text.secondary}>
                                Uploaded: {formatDate(doc.uploadedAt)}
                              </Typography>
                              {doc.fileData && (
                                <Typography variant="caption" display="block" color={COLORS.status.success}>
                                  Stored in Firestore
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Document">
                            <IconButton
                              size="small"
                              onClick={() => viewDocument(doc)}
                              sx={{ color: COLORS.primary }}
                            >
                              <Box sx={{ fontSize: '1rem', fontWeight: 'bold' }}>V</Box>
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download Document">
                            <IconButton
                              size="small"
                              onClick={() => downloadDocument(doc)}
                              sx={{ color: COLORS.primary }}
                            >
                              <Box sx={{ fontSize: '1rem', fontWeight: 'bold' }}>D</Box>
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Document">
                            <IconButton
                              size="small"
                              onClick={() => deleteDocument(doc)}
                              sx={{ color: COLORS.status.error }}
                            >
                              <Box sx={{ fontSize: '1rem', fontWeight: 'bold' }}>X</Box>
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{ fontSize: '3rem', color: COLORS.text.disabled, mb: 2, fontWeight: 'bold' }}>D</Box>
                    <Typography variant="h6" color={COLORS.text.secondary} gutterBottom>
                      No documents uploaded
                    </Typography>
                    <Typography variant="body2" color={COLORS.text.secondary}>
                      Upload your transcripts, resume, and other important documents
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

{/* Enhanced Notifications Tab */}
<TabPanel value={tabValue} index={5}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
      Notifications ({notifications.length})
      {notifications.filter(n => !n.read).length > 0 && (
        <Typography variant="body2" component="span" sx={{ color: COLORS.status.info, ml: 1 }}>
          ({notifications.filter(n => !n.read).length} unread)
        </Typography>
      )}
    </Typography>
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="outlined"
        onClick={markAllNotificationsRead}
        disabled={notifications.filter(n => !n.read).length === 0}
        sx={{ borderColor: COLORS.primary, color: COLORS.primary }}
      >
        Mark All Read
      </Button>
      <Button
        variant="outlined"
        onClick={clearAllNotifications}
        disabled={notifications.length === 0}
        sx={{ borderColor: COLORS.status.error, color: COLORS.status.error }}
      >
        Clear All
      </Button>
      <Button
        variant="contained"
        onClick={() => createNotification({
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test notification to verify the system is working',
          priority: 'low'
        })}
        sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.secondary } }}
      >
        Test Notifications
      </Button>
    </Box>
  </Box>

  {notifications.length > 0 ? (
    <>
      <List>
        {notifications.map((notification, index) => (
          <ListItem 
            key={notification.id} 
            divider={index < notifications.length - 1}
            sx={{ 
              backgroundColor: notification.read ? COLORS.background : `${COLORS.primary}08`,
              borderLeft: notification.priority === 'high' ? '4px solid' : 'none',
              borderColor: COLORS.status.error,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: notification.read ? `${COLORS.primary}04` : `${COLORS.primary}12`,
              }
            }}
          >
            <ListItemIcon>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: `${COLORS.primary}20`, 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.primary,
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}>
                N
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" color={COLORS.text.primary}>
                    {notification.title}
                  </Typography>
                  {!notification.read && (
                    <Chip label="New" color="primary" size="small" />
                  )}
                  {notification.priority === 'high' && (
                    <Chip label="Important" color="error" size="small" variant="outlined" />
                  )}
                  {notification.id && notification.id.startsWith('local-') && (
                    <Chip label="Local" color="warning" size="small" variant="outlined" />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color={COLORS.text.primary}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color={COLORS.text.secondary}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </Typography>
                  {notification.type && (
                    <Chip 
                      label={notification.type.replace('_', ' ')} 
                      size="small" 
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              }
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {!notification.read && (
                <Button
                  size="small"
                  onClick={() => markNotificationRead(notification.id)}
                  sx={{ color: COLORS.primary }}
                >
                  Mark Read
                </Button>
              )}
              <Button
                size="small"
                onClick={() => {
                  if (notification.type === 'admission' || notification.type === 'course') {
                    setTabValue(1); // Courses tab
                  } else if (notification.type === 'job_match' || notification.type === 'job') {
                    setTabValue(2); // Jobs tab
                  } else if (notification.type === 'document') {
                    setTabValue(4); // Documents tab
                  } else if (notification.type === 'profile') {
                    setTabValue(3); // Profile tab
                  }
                }}
                sx={{ color: COLORS.text.secondary }}
              >
                View Related
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Notification Statistics */}
      <Card sx={{ p: 3, mt: 3, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary }}>Notification Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color={COLORS.primary}>{notifications.length}</Typography>
              <Typography variant="body2" color={COLORS.text.secondary}>Total</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color={COLORS.status.info}>{notifications.filter(n => !n.read).length}</Typography>
              <Typography variant="body2" color={COLORS.text.secondary}>Unread</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color={COLORS.status.warning}>{notifications.filter(n => n.priority === 'high').length}</Typography>
              <Typography variant="body2" color={COLORS.text.secondary}>Important</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color={COLORS.status.success}>
                {notifications.length > 0 ? Math.round((notifications.filter(n => n.read).length / notifications.length) * 100) : 0}%
              </Typography>
              <Typography variant="body2" color={COLORS.text.secondary}>Read</Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </>
  ) : (
    <Card sx={{ p: 4, textAlign: 'center', backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <Box sx={{ fontSize: '3rem', color: COLORS.text.disabled, mb: 2, fontWeight: 'bold' }}>N</Box>
      <Typography variant="h6" color={COLORS.text.secondary} gutterBottom>
        No notifications
      </Typography>
      <Typography variant="body2" color={COLORS.text.secondary}>
        You're all caught up! New notifications will appear here automatically.
      </Typography>
      <Button 
        variant="contained" 
        sx={{ mt: 2, backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.secondary } }}
        onClick={() => createNotification({
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test notification to verify the system is working',
          priority: 'low'
        })}
      >
        Create Test Notification
      </Button>
    </Card>
  )}
</TabPanel>
      </Paper>

      {/* Job Application Dialog */}
      <Dialog open={applyJobDialogOpen} onClose={() => setApplyJobDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" color={COLORS.text.primary}>Apply for {selectedJob?.title}</Typography>
          <Typography variant="body1" color={COLORS.text.secondary}>
            {selectedJob?.companyName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color={COLORS.text.primary}>Job Details</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography color={COLORS.text.primary}>{selectedJob.location || 'Not specified'}</Typography>
                    </Box>
                    {selectedJob.salary && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography color={COLORS.text.primary}>{selectedJob.salary}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography color={COLORS.text.primary}>
                        {selectedJob.postedAt 
                          ? `Posted ${new Date(selectedJob.postedAt).toLocaleDateString()}`
                          : 'Posted date not available'
                        }
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }} color={COLORS.text.primary}>Job Description</Typography>
                  <Typography variant="body2" color={COLORS.text.primary}>
                    {selectedJob.description || 'No description available.'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color={COLORS.text.primary}>Your Match</Typography>
                  <Box sx={{ textAlign: 'center', p: 3, bgcolor: `${COLORS.primary}20`, borderRadius: 2 }}>
                    <Typography variant="h2" color="primary" sx={{ color: COLORS.primary }}>
                      {calculateJobMatch(selectedJob)}%
                    </Typography>
                    <Typography variant="body1" color={COLORS.text.secondary}>
                      Profile Match Score
                    </Typography>
                    {renderMatchStars(calculateJobMatch(selectedJob))}
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }} color={COLORS.text.primary}>Requirements</Typography>
                  <List dense>
                    {selectedJob.requirements?.minGPA && (
                      <ListItem>
                        <ListItemIcon>
                          <Box sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: profile?.gpa >= selectedJob.requirements.minGPA ? `${COLORS.status.success}20` : `${COLORS.status.error}20`, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: profile?.gpa >= selectedJob.requirements.minGPA ? COLORS.status.success : COLORS.status.error,
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            G
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography color={COLORS.text.primary}>{`Minimum GPA: ${selectedJob.requirements.minGPA}`}</Typography>}
                          secondary={`Your GPA: ${profile?.gpa || 'Not set'}`}
                        />
                      </ListItem>
                    )}
                    {selectedJob.requirements?.field && (
                      <ListItem>
                        <ListItemIcon>
                          <Box sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: profile?.field && profile.field.toLowerCase().includes(selectedJob.requirements.field.toLowerCase()) ? `${COLORS.status.success}20` : `${COLORS.status.error}20`, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: profile?.field && profile.field.toLowerCase().includes(selectedJob.requirements.field.toLowerCase()) ? COLORS.status.success : COLORS.status.error,
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            F
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography color={COLORS.text.primary}>{`Field: ${selectedJob.requirements.field}`}</Typography>}
                          secondary={`Your Field: ${profile?.field || 'Not set'}`}
                        />
                      </ListItem>
                    )}
                    {selectedJob.requirements?.minExperience > 0 && (
                      <ListItem>
                        <ListItemIcon>
                          <Box sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: profile?.experience >= selectedJob.requirements.minExperience ? `${COLORS.status.success}20` : `${COLORS.status.error}20`, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: profile?.experience >= selectedJob.requirements.minExperience ? COLORS.status.success : COLORS.status.error,
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            E
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography color={COLORS.text.primary}>{`Experience: ${selectedJob.requirements.minExperience} years`}</Typography>}
                          secondary={`Your Experience: ${profile?.experience || 0} years`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Your application will include your profile information and uploaded documents. 
                  Make sure your profile is complete for the best chances!
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyJobDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => applyForJob(selectedJob)}
            variant="contained"
            size="large"
            sx={{ backgroundColor: COLORS.primary, '&:hover': { backgroundColor: COLORS.secondary } }}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <SpeedDial
        ariaLabel="Quick actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>
    </Container>
  );
};

export default StudentDashboard;