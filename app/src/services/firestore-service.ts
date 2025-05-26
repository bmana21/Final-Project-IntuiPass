import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { UserPatternData } from '../models/user-pattern-data.ts';


// ------------------- THIS IS DUPLICATION --------------

const firebaseConfig = {
  apiKey: "AIzaSyDUboPdO20cz9GAB9WGaOW6PYXBLEwp_Q4",
  authDomain: "final-project-intuipass.firebaseapp.com",
  projectId: "final-project-intuipass",
  storageBucket: "final-project-intuipass.firebasestorage.app",
  messagingSenderId: "26624816574",
  appId: "1:26624816574:web:7f7d2a3f08dfa0b838b5ef",
  measurementId: "G-Y9R7BLXZ1Y"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// ------------------------------------------------
const db = firebase.firestore();

/**
 * Adds a UserPatternData document to Firestore.
 */
export async function addUserPatternData(userPatternData: UserPatternData): Promise<void> {
  try {
    const docRef = await db.collection("user_patterns").add(userPatternData.toFirestore());
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

/**
 * Retrieves user patterns by user UUID.
 */
export async function getUserPatternDataByUUID(user_uuid: string): Promise<UserPatternData[]> {
  try {
    const querySnapshot = await db.collection("user_patterns")
      .where("user_uuid", "==", user_uuid)
      .orderBy("createdAt", "desc")
      .get();

    const userPatterns = querySnapshot.docs.map((doc) => UserPatternData.fromFirestore(doc));
    console.log("User Patterns:", userPatterns);
    return userPatterns;
  } catch (error) {
    console.error("Error getting documents: ", error);
    return [];
  }
}

/**
 * Retrieves user patterns by user UUID and website URL.
 */
export async function getUserPatternDataByUUIDAndURL(user_uuid: string, website_url: string): Promise<UserPatternData[]> {
  try {
    const querySnapshot = await db.collection("user_patterns")
      .where("user_uuid", "==", user_uuid)
      .where("website_url", "==", website_url)
      .orderBy("createdAt", "desc")
      .get();

    const userPatterns = querySnapshot.docs.map((doc) => UserPatternData.fromFirestore(doc));
    console.log("User Patterns:", userPatterns);
    return userPatterns;
  } catch (error) {
    console.error("Error getting documents: ", error);
    return [];
  }
}
