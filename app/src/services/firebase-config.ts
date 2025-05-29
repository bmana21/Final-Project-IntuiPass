import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDUboPdO20cz9GAB9WGaOW6PYXBLEwp_Q4",
  authDomain: "final-project-intuipass.firebaseapp.com",
  projectId: "final-project-intuipass",
  storageBucket: "final-project-intuipass.firebasestorage.app",
  messagingSenderId: "26624816574",
  appId: "1:26624816574:web:7f7d2a3f08dfa0b838b5ef",
  measurementId: "G-Y9R7BLXZ1Y"
};

const firebaseApp = firebase.apps.length
  ? firebase.app()
  : firebase.initializeApp(firebaseConfig);

export { firebaseApp };