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
import {
  School, Work, Description, Upload, Person, Send, CheckCircle, Error,
  ExpandMore, Notifications, Dashboard, TrendingUp, CalendarToday,
  LocationOn, AttachMoney, Schedule, Star, Bookmark, BookmarkBorder,
  Download, Delete, Visibility, Email, Phone, LinkedIn,
  ExpandLess, Share, FilterList, Lightbulb, Group, Assessment,
  Psychology, EmojiEvents, Add, Menu, Close, AutoAwesome,
  Rocket, Celebration, PsychologyAlt, Timeline, Analytics,
  History, Warning, HowToReg, Assignment, Security
} from '@mui/icons-material';
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
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  return '📎';
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

  // Enhanced data loading with proper integration
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      await Promise.all([
        fetchInstitutions(),
        fetchCourses(),
        fetchFaculties(),
        fetchJobs(),
        fetchApplications(),
        fetchJobApplications(),
        fetchDocuments(),
        fetchBookmarks()
      ]);
      
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

  // FIXED: Working admission decision handler
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
          console.log(`✅ Confirmed: ${application.courseName}`);
        } else {
          // Other applications - reject them
          await updateDoc(applicationRef, {
            decisionMade: true,
            finalChoice: false,
            status: 'rejected_by_student',
            decisionDate: serverTimestamp()
          });
          console.log(`❌ Rejected: ${application.courseName}`);
        }
      }

      // Refresh applications data
      await fetchApplications();
      
      // Close dialog and reset state
      setAdmissionDecisionOpen(false);
      setPendingAdmissionDecision(null);
      
      enqueueSnackbar('Admission decision saved successfully!', { variant: 'success' });
      
      // Add notification
      setNotifications(prev => [{
        id: `decision-${Date.now()}`,
        type: 'admission_decision',
        title: '✅ Decision Recorded',
        message: 'Your admission choice has been recorded successfully',
        timestamp: new Date(),
        read: false
      }, ...prev]);

    } catch (error) {
      console.error('Error handling admission decision:', error);
      enqueueSnackbar(`Failed to save decision: ${error.message}`, { variant: 'error' });
    }
  };

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
  }, [applications, checkMultipleAdmissions]);

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
    }
  }, [profile]);

  // Enhanced course qualification check
  const checkCourseQualification = (course) => {
    if (!profile || !course.requirements) return true;
    
    const requirements = course.requirements;
    
    // Check GPA requirement
    if (requirements.minGPA && (profile.gpa === undefined || profile.gpa === null || profile.gpa < requirements.minGPA)) {
      return false;
    }
    
    // Check high school grades
    if (requirements.minGrades && profile.highSchoolGrades) {
      for (const [subject, minGrade] of Object.entries(requirements.minGrades)) {
        const studentGrade = profile.highSchoolGrades[subject];
        if (studentGrade && studentGrade < minGrade) {
          return false;
        }
      }
    }
    
    // Check field requirement
    if (requirements.requiredField && profile.field !== requirements.requiredField) {
      return false;
    }
    
    return true;
  };

  // Enhanced job match calculation
  const calculateJobMatch = (job) => {
    if (!profile || !job) return 0;
    
    let matchScore = 0;
    let criteriaMatched = 0;
    let totalCriteria = 0;

    // GPA match (30%)
    if (job.requirements?.minGPA) {
      totalCriteria++;
      if (profile.gpa && profile.gpa >= job.requirements.minGPA) {
        criteriaMatched++;
        matchScore += 30;
      }
    }

    // Field match (30%)
    if (job.requirements?.field) {
      totalCriteria++;
      if (profile.field && profile.field.toLowerCase().includes(job.requirements.field.toLowerCase())) {
        criteriaMatched++;
        matchScore += 30;
      }
    }

    // Experience match (20%)
    if (job.requirements?.minExperience) {
      totalCriteria++;
      if (profile.experience && profile.experience >= job.requirements.minExperience) {
        criteriaMatched++;
        matchScore += 20;
      }
    }

    // Skills match (20%)
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
        matchScore += (matchedSkills.length / job.requirements.skills.length) * 20;
      }
    }

    return totalCriteria === 0 ? 50 : Math.min(100, Math.round(matchScore));
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
                  background: #1976d2;
                  color: white;
                  padding: 10px 20px;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  margin-top: 15px;
                }
                .download-btn:hover {
                  background: #1565c0;
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

  // Calculate course match percentage
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
        if (!studentGrade || studentGrade < minGrade) {
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

  // Job application
  const applyForJob = async (job) => {
    try {
      const matchScore = calculateJobMatch(job);

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

  // Mark notification as read
  const markNotificationRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    enqueueSnackbar('All notifications cleared', { variant: 'info' });
  };

  // Speed dial actions
  const speedDialActions = [
    { icon: <School />, name: 'Quick Apply', action: () => setTabValue(1) },
    { icon: <Work />, name: 'Find Jobs', action: () => setTabValue(2) },
    { icon: <Upload />, name: 'Upload Document', action: () => setTabValue(4) },
    { icon: <Person />, name: 'Update Profile', action: () => setTabValue(3) },
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

  // Filter jobs
  const getFilteredJobs = () => {
    let filtered = jobs;
    
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
      default: return 'default';
    }
  };

  // Add high school grade
  const addHighSchoolGrade = () => {
    const subjectInput = document.getElementById('subject-input');
    const gradeInput = document.getElementById('grade-input');
    const subject = subjectInput?.value.trim();
    const grade = parseFloat(gradeInput?.value);

    if (subject && !isNaN(grade) && grade >= 0 && grade <= 100) {
      setHighSchoolGrades(prev => ({
        ...prev,
        [subject]: grade
      }));
      subjectInput.value = '';
      gradeInput.value = '';
      enqueueSnackbar('Grade added successfully!', { variant: 'success' });
    } else {
      enqueueSnackbar('Please enter valid subject and grade (0-100)', { variant: 'error' });
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
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>Loading your dashboard...</Typography>
          <Typography variant="body2" color="text.secondary">
            Preparing your personalized student experience
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header with Enhanced Stats */}
      <Paper sx={{ 
        p: 4, 
        mb: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
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
                🎓 Student Dashboard
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, mb: 1 }}>
                Welcome back, {profile?.name || 'Student'}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
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
                <Notifications sx={{ fontSize: 30, color: 'white' }} />
              </Badge>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'rgba(255,255,255,0.2)',
                border: '3px solid rgba(255,255,255,0.3)'
              }}>
                <Person sx={{ fontSize: 40 }} />
              </Avatar>
            </Box>
          </Box>

          {/* Enhanced Stats Grid */}
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.totalApplications}</Typography>
                <Typography variant="body2">Total Applications</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.admissionRate}%</Typography>
                <Typography variant="body2">Admission Rate</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.avgMatchScore}%</Typography>
                <Typography variant="body2">Avg Match Score</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.profileCompletion}%</Typography>
                <Typography variant="body2">Profile Complete</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.qualifiedJobs}</Typography>
                <Typography variant="body2">Qualified Jobs</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{dashboardStats.pendingApplications}</Typography>
                <Typography variant="body2">Pending Applications</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{documents.length}</Typography>
                <Typography variant="body2">Documents</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Multiple Admission Decision Dialog - FIXED AND WORKING */}
      <Dialog
        open={admissionDecisionOpen}
        onClose={() => setAdmissionDecisionOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" color="primary">
            🎉 Multiple Admission Offers!
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Congratulations! You've been admitted to multiple institutions. Please select one institution to attend:
          </Typography>

          <List>
            {pendingAdmissionDecision?.map((application) => (
              <ListItem key={application.id} divider sx={{ alignItems: "flex-start" }}>
                <ListItemIcon>
                  <School color="success" />
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
                  startIcon={<CheckCircle />}
                  sx={{ 
                    backgroundColor: '#4CAF50',
                    '&:hover': {
                      backgroundColor: '#45a049',
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
              <strong>Important:</strong> Selecting one institution will automatically decline offers from other institutions.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setAdmissionDecisionOpen(false)}
            variant="outlined"
          >
            Decide Later
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content with Tabs */}
      <Paper sx={{ width: '100%', mb: 3, position: 'relative' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Dashboard />} label="Overview" {...a11yProps(0)} />
          <Tab icon={<School />} label={`Courses (${courses.length})`} {...a11yProps(1)} />
          <Tab icon={<Work />} label={`Jobs (${jobs.length})`} {...a11yProps(2)} />
          <Tab icon={<Person />} label="Profile" {...a11yProps(3)} />
          <Tab icon={<Description />} label={`Documents (${documents.length})`} {...a11yProps(4)} />
          <Tab 
            icon={
              <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                <Notifications />
              </Badge>
            } 
            label="Notifications" 
            {...a11yProps(5)}
          />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Quick Stats & Progress */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline /> Application Progress
                </Typography>
                <Stepper orientation="vertical">
                  <Step active={true} completed={dashboardStats.profileCompletion >= 50}>
                    <StepLabel>
                      <Typography variant="subtitle1">Profile Completion</Typography>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={dashboardStats.profileCompletion} 
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2">{Math.round(dashboardStats.profileCompletion)}%</Typography>
                      </Box>
                    </StepContent>
                  </Step>
                  <Step active={applications.length > 0} completed={applications.some(app => app.status === 'admitted')}>
                    <StepLabel>
                      <Typography variant="subtitle1">Course Applications</Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography>{applications.length} applications submitted</Typography>
                      {applications.some(app => app.status === 'admitted') && (
                        <Chip label="Admitted!" color="success" size="small" sx={{ mt: 1 }} />
                      )}
                    </StepContent>
                  </Step>
                  <Step active={jobApplications.length > 0}>
                    <StepLabel>
                      <Typography variant="subtitle1">Job Applications</Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography>{jobApplications.length} applications submitted</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average match score: {Math.round(dashboardStats.avgMatchScore)}%
                      </Typography>
                    </StepContent>
                  </Step>
                </Stepper>
              </Card>

              {/* Recent Activity */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <History /> Recent Activity
                </Typography>
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
                          {item.jobId ? <Work color="primary" /> : <School color="secondary" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.jobTitle || item.courseName}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {item.companyName || item.instituteName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
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
                        primary="No recent activity"
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
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Rocket /> Quick Actions
                </Typography>

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
                      }}
                    >
                      <School sx={{ mb: 1 }} />
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
                      }}
                    >
                      <Work sx={{ mb: 1 }} />
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
                      }}
                    >
                      <Upload sx={{ mb: 1 }} />
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
                      }}
                    >
                      <Person sx={{ mb: 1 }} />
                      Update Profile
                    </Button>
                  </Grid>
                </Grid>
              </Card>

              {/* Recommended Jobs */}
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesome /> Recommended Jobs
                </Typography>
                {getFilteredJobs()
                  .filter(job => calculateJobMatch(job) >= 75)
                  .slice(0, 3)
                  .map(job => (
                    <Card key={job.id} variant="outlined" sx={{ p: 2, mb: 2, cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedJob(job);
                        setApplyJobDialogOpen(true);
                      }}
                    >
                      <Typography fontWeight="bold" gutterBottom>{job.title}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {job.companyName}
                      </Typography>
                      {renderMatchStars(calculateJobMatch(job))}
                      <Button 
                        size="small" 
                        startIcon={<BookmarkBorder />}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(job);
                        }}
                        sx={{ mt: 1 }}
                      >
                        Save
                      </Button>
                    </Card>
                  ))}
                {getFilteredJobs().filter(job => calculateJobMatch(job) >= 75).length === 0 && (
                  <Typography color="text.secondary" textAlign="center" py={2}>
                    {jobs.length === 0 ? 'No jobs available yet' : 'Complete your profile for better recommendations'}
                  </Typography>
                )}
              </Card>

              {/* Profile Completion */}
              <Card sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Typography variant="h6" gutterBottom>
                  🎯 Profile Strength
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
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
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
            <Typography variant="h5" gutterBottom>Course Applications</Typography>
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
              <Card sx={{ p: 3, position: 'sticky', top: 100 }}>
                <Typography variant="h6" gutterBottom>Apply for New Course</Typography>
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
                    startIcon={<Send />}
                    size="large"
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
                  <Typography variant="h6" gutterBottom>Your Applications ({applications.length})</Typography>
                  {applications.length > 0 ? (
                    <List dense>
                      {applications.map((application) => (
                        <ListItem key={application.id} divider>
                          <ListItemIcon>
                            <School color={getStatusColor(application.status)} />
                          </ListItemIcon>
                          <ListItemText
                            primary={application.courseName || 'Unknown Course'}
                            secondary={
                              <Box>
                                <Typography variant="body2">{application.instituteName || 'Unknown Institution'}</Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
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
                      <School sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography color="text.secondary">
                        No applications yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Apply to courses using the form above
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>

            {/* Available Courses */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Available Courses ({getFilteredCourses().length})
              </Typography>
              
              {getFilteredCourses().length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center' }}>
                  <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No courses found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
                          '&:hover': { boxShadow: 2 },
                          borderColor: !isQualified ? 'error.light' : 'default'
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography fontWeight="bold" gutterBottom variant="h6">
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
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {institution?.name} • {faculty?.name}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 2 }} color="text.primary">
                                {course.description || 'No description available.'}
                              </Typography>
                              
                              {/* Course Requirements */}
                              {course.requirements && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" fontWeight="bold" gutterBottom>
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
                                  startIcon={<Send />}
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
            <Typography variant="h5" gutterBottom>Job Opportunities</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                label={`All Jobs (${jobs.length})`}
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
                label={`Qualified (${jobs.filter(job => calculateJobMatch(job) >= 50).length})`}
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
                <Card sx={{ p: 4, textAlign: 'center' }}>
                  <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {jobs.length === 0 ? 'No jobs available yet' : 'No jobs match your current filters'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {jobs.length === 0 
                      ? "Check back later for new job opportunities!"
                      : "Try changing your filters to see more jobs."
                    }
                  </Typography>
                  {jobs.length === 0 && (
                    <Button 
                      variant="contained" 
                      sx={{ mt: 2 }}
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
                      borderColor: !isQualified ? 'warning.light' : 'default',
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
                          <Typography fontWeight="bold" gutterBottom variant="h6">
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {job.companyName} • {job.location}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => toggleBookmark(job)}
                          color={isBookmarked ? 'primary' : 'default'}
                        >
                          {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                        </IconButton>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                        {job.description || 'No description available.'}
                      </Typography>

                      {/* Match Score */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
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
                        startIcon={hasApplied ? <CheckCircle /> : <Send />}
                        fullWidth
                        size="large"
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
              <Card sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person /> Profile Management
                </Typography>
                
                {profileUpdateStatus && (
                  <Alert
                    severity={profileUpdateStatus === 'success' ? 'success' : profileUpdateStatus === 'error' ? 'error' : 'info'}
                    sx={{ mb: 3 }}
                    icon={profileUpdateStatus === 'success' ? <CheckCircle /> : profileUpdateStatus === 'error' ? <Error /> : <CircularProgress size={20} />}
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
                  
                  {/* High School Grades */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>High School Grades</Typography>
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
                        <Typography variant="body2" color="text.secondary">
                          No grades added yet
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <TextField
                        label="Subject"
                        size="small"
                        placeholder="e.g., Mathematics"
                        id="subject-input"
                        sx={{ minWidth: 120 }}
                      />
                      <TextField
                        label="Grade"
                        type="number"
                        size="small"
                        placeholder="Grade"
                        inputProps={{ min: 0, max: 100 }}
                        id="grade-input"
                        sx={{ minWidth: 100 }}
                      />
                      <Button 
                        variant="outlined" 
                        onClick={addHighSchoolGrade}
                      >
                        Add Grade
                      </Button>
                    </Box>
                  </Grid>
                  
                  {/* Qualifications */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Additional Qualifications</Typography>
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
                        <Typography variant="body2" color="text.secondary">
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
                      >
                        Add
                      </Button>
                    </Box>
                  </Grid>

                  {/* Skills Section */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Skills</Typography>
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
                        <Typography variant="body2" color="text.secondary">
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
                      >
                        Add
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
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
                    }}
                  >
                    Reset
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Profile Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <Avatar sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}>
                  {profile?.name?.charAt(0) || 'S'}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {profile?.name || 'Student'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {profile?.email}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Field:</strong> {profile?.field || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>GPA:</strong> {profile?.gpa || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Experience:</strong> {profile?.experience || 0} years
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Skills:</strong> {skills.length} added
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Qualifications:</strong> {qualifications.length} added
                  </Typography>
                  <Typography variant="body2">
                    <strong>High School Grades:</strong> {Object.keys(highSchoolGrades).length} subjects
                  </Typography>
                </Box>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Profile Strength
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={dashboardStats.profileCompletion} 
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(dashboardStats.profileCompletion)}% Complete
                  </Typography>
                </Box>
              </Card>

              {/* Quick Tips */}
              <Card sx={{ p: 3, mt: 3, bgcolor: 'info.50' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Lightbulb /> Profile Tips
                </Typography>
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
                    <ListItemText primary="Add additional qualifications and certificates" />
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
              <Card sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description /> Upload Documents
                </Typography>
                
                {/* Upload Status */}
                {uploadStatus && (
                  <Alert
                    severity={uploadStatus === 'success' ? 'success' : uploadStatus === 'error' ? 'error' : 'info'}
                    sx={{ mb: 3 }}
                    icon={
                      uploadStatus === 'success' ? <CheckCircle /> : 
                      uploadStatus === 'error' ? <Error /> : 
                      <CircularProgress size={20} />
                    }
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
                      borderColor: file ? 'primary.main' : 'grey.300',
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 2,
                      cursor: uploading ? 'default' : 'pointer',
                      backgroundColor: file ? 'primary.50' : 'grey.50',
                      transition: 'all 0.2s',
                      '&:hover': !uploading ? { 
                        backgroundColor: file ? 'primary.100' : 'grey.100',
                        borderColor: 'primary.main'
                      } : {},
                      opacity: uploading ? 0.7 : 1
                    }}
                    onClick={() => !uploading && document.getElementById('file-upload').click()}
                  >
                    <Upload sx={{ 
                      fontSize: 48, 
                      color: file ? 'primary.main' : 'grey.500', 
                      mb: 2,
                      opacity: uploading ? 0.5 : 1
                    }} />
                    <Typography variant="h6" gutterBottom color={file ? 'primary.main' : 'text.primary'}>
                      {file ? '✓ File Selected' : 'Click to select a file'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                      <Box sx={{ mt: 2, p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'primary.100' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {getFileIcon(file.type)} {file.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Size: {(file.size / 1024 / 1024).toFixed(2)} MB • Type: {file.type || 'Unknown'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Button
                    variant="contained"
                    onClick={uploadDocument}
                    disabled={!file || uploading}
                    startIcon={uploading ? <CircularProgress size={20} /> : <Upload />}
                    size="large"
                    sx={{ mt: 2 }}
                  >
                    {uploading ? `Processing... (${Math.round(uploadProgress)}%)` : `Upload ${docType.charAt(0).toUpperCase() + docType.slice(1)}`}
                  </Button>

                  {uploading && (
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      Converting file to base64 and saving to database...
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description /> Your Documents ({documents.length})
                </Typography>
                {documents.length > 0 ? (
                  <List>
                    {documents.map((doc) => (
                      <ListItem key={doc.id} divider>
                        <ListItemIcon>
                          <Description color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getFileIcon(doc.mimeType)} {doc.fileName}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Type: {doc.fileType} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded: {formatDate(doc.uploadedAt)}
                              </Typography>
                              {doc.fileData && (
                                <Typography variant="caption" display="block" color="success.main">
                                  ✓ Stored in Firestore
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
                              color="primary"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download Document">
                            <IconButton
                              size="small"
                              onClick={() => downloadDocument(doc)}
                              color="primary"
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Document">
                            <IconButton
                              size="small"
                              onClick={() => deleteDocument(doc)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Description sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No documents uploaded
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload your transcripts, resume, and other important documents
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Notifications</Typography>
            <Button
              variant="outlined"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              Clear All
            </Button>
          </Box>

          {notifications.length > 0 ? (
            <List>
              {notifications.map((notification, index) => (
                <ListItem 
                  key={notification.id} 
                  divider={index < notifications.length - 1}
                  sx={{ 
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: notification.priority === 'high' ? '4px solid' : 'none',
                    borderColor: 'error.main'
                  }}
                >
                  <ListItemIcon>
                    {notification.type === 'job_match' && <Work color="success" />}
                    {notification.type === 'application' && <Send color="primary" />}
                    {notification.type === 'document' && <Description color="info" />}
                    {notification.type === 'achievement' && <EmojiEvents color="warning" />}
                    {notification.type === 'system' && <Notifications color="action" />}
                    {notification.type === 'admission' && <School color="success" />}
                    {notification.type === 'admission_decision' && <HowToReg color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Chip label="New" color="primary" size="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  {!notification.read && (
                    <Button
                      size="small"
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're all caught up! New notifications will appear here.
              </Typography>
            </Card>
          )}
        </TabPanel>
      </Paper>

      {/* Job Application Dialog */}
      <Dialog open={applyJobDialogOpen} onClose={() => setApplyJobDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5">Apply for {selectedJob?.title}</Typography>
          <Typography variant="body1" color="text.secondary">
            {selectedJob?.companyName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Job Details</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography>{selectedJob.location || 'Not specified'}</Typography>
                    </Box>
                    {selectedJob.salary && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney fontSize="small" color="action" />
                        <Typography>{selectedJob.salary}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography>
                        {selectedJob.postedAt 
                          ? `Posted ${new Date(selectedJob.postedAt).toLocaleDateString()}`
                          : 'Posted date not available'
                        }
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Job Description</Typography>
                  <Typography variant="body2">
                    {selectedJob.description || 'No description available.'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Your Match</Typography>
                  <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="h2" color="primary">
                      {calculateJobMatch(selectedJob)}%
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Profile Match Score
                    </Typography>
                    {renderMatchStars(calculateJobMatch(selectedJob))}
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Requirements</Typography>
                  <List dense>
                    {selectedJob.requirements?.minGPA && (
                      <ListItem>
                        <ListItemIcon>
                          <School color={profile?.gpa >= selectedJob.requirements.minGPA ? "success" : "error"} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Minimum GPA: ${selectedJob.requirements.minGPA}`}
                          secondary={`Your GPA: ${profile?.gpa || 'Not set'}`}
                        />
                      </ListItem>
                    )}
                    {selectedJob.requirements?.field && (
                      <ListItem>
                        <ListItemIcon>
                          <Psychology color={
                            profile?.field && profile.field.toLowerCase().includes(selectedJob.requirements.field.toLowerCase()) 
                              ? "success" : "error"
                          } />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Field: ${selectedJob.requirements.field}`}
                          secondary={`Your Field: ${profile?.field || 'Not set'}`}
                        />
                      </ListItem>
                    )}
                    {selectedJob.requirements?.minExperience > 0 && (
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUp color={profile?.experience >= selectedJob.requirements.minExperience ? "success" : "error"} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Experience: ${selectedJob.requirements.minExperience} years`}
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
            startIcon={<Send />}
            size="large"
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
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>
    </Container>
  );
};

export default StudentDashboard;