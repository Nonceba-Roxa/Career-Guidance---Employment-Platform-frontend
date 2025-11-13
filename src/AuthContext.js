// src/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Send email verification
  const sendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await sendEmailVerification(user);
      console.log('✅ Verification email sent');
      return true;
    } catch (err) {
      console.error('❌ Error sending verification email:', err);
      throw err;
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
      return true;
    } catch (err) {
      console.error('❌ Error sending password reset email:', err);
      throw err;
    }
  };

  // Check if email is verified
  const isEmailVerified = () => {
    return user?.emailVerified || false;
  };

  // Load user profile from Firestore
  const loadUserProfile = async (userId) => {
    try {
      console.log('🔄 Loading profile for user:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ Profile loaded:', userData);
        setProfile(userData);
        return userData;
      } else {
        console.warn('❌ User document not found for ID:', userId);
        setProfile(null);
        return null;
      }
    } catch (err) {
      console.error('❌ Error loading user profile:', err);
      setError('Failed to load user profile: ' + err.message);
      setProfile(null);
      return null;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      return await loadUserProfile(user.uid);
    }
    return null;
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('🔄 Updating profile for user:', user.uid);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...profileData,
        lastUpdated: new Date()
      });
      
      await refreshProfile();
      console.log('✅ Profile updated successfully');
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      throw err;
    }
  };

  // Login function with email verification check
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Attempting login for:', email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase login successful:', userCredential.user.uid);

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        console.warn('⚠️ Email not verified for user:', userCredential.user.uid);
        // You can choose to allow login or block it based on your requirements
        // For now, we'll allow login but track verification status
      }

      await loadUserProfile(userCredential.user.uid);

      return userCredential;
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Signup function with email verification
  const signup = async (email, password, userData) => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Attempting registration for:', email);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase user created:', userCredential.user.uid);

      // Send email verification
      await sendEmailVerification(userCredential.user);
      console.log('✅ Verification email sent');

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userData,
        uid: userCredential.user.uid,
        email: email,
        emailVerified: false,
        createdAt: new Date(),
        lastUpdated: new Date()
      });

      console.log('✅ User profile created in Firestore');

      await loadUserProfile(userCredential.user.uid);

      return userCredential;
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🔄 Logging out user');
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setError('');
      console.log('✅ Logout successful');
    } catch (err) {
      console.error('❌ Logout error:', err);
      setError('Failed to log out: ' + err.message);
    }
  };

  // Clear error
  const clearError = () => setError('');

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔄 Auth state changed:', currentUser ? currentUser.uid : 'No user');
      setLoading(true);
      try {
        if (currentUser) {
          setUser(currentUser);
          await loadUserProfile(currentUser.uid);
        } else {
          setUser(null);
          setProfile(null);
        }
        setError('');
      } catch (err) {
        console.error('❌ Auth state change error:', err);
        setError('Authentication error: ' + err.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    login,
    signup,
    logout,
    clearError,
    sendVerificationEmail,
    resetPassword,
    isEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};