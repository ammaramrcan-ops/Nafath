import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0MCHhQIG_sU7uOuDjXuN7L__KGr-ZqAM",
  authDomain: "nafath-ammar.firebaseapp.com",
  databaseURL: "https://nafath-ammar-default-rtdb.firebaseio.com",
  projectId: "nafath-ammar",
  storageBucket: "nafath-ammar.firebasestorage.app",
  messagingSenderId: "62035328143",
  appId: "1:62035328143:web:3705abb9e75400c85044fa",
  measurementId: "G-E3H4SD6NVB"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
