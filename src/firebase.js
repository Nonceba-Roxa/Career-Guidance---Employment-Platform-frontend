// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDo6HLx_kldxozb0ZMfBGzqhLWM17CPEP8",
  authDomain: "career-guidance-platform-67bed.firebaseapp.com",
  projectId: "career-guidance-platform-67bed",
  storageBucket: "career-guidance-platform-67bed.firebasestorage.app",
  messagingSenderId: "799547527561",
  appId: "1:799547527561:web:4f30b67898191002f69158",
  measurementId: "G-8MFFXVGL5R"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export Firebase functions you need
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile
} from 'firebase/auth';

export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

export {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

export default app;