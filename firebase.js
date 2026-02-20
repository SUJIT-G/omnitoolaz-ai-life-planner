// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_NRbV_TPnQyFGPa2f1LhBxstI5q4wKrQ",
  authDomain: "omnitoolz-ai-life-planner.firebaseapp.com",
  projectId: "omnitoolz-ai-life-planner",
  storageBucket: "omnitoolz-ai-life-planner.firebasestorage.app",
  messagingSenderId: "292715475649",
  appId: "1:292715475649:web:4e3f24b629995fd80f1a40"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
    auth, 
    googleProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
};
