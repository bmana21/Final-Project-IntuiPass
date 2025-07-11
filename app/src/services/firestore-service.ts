import { firebaseApp } from "../firebase/firebase-config.ts";
import { UserPatternData } from '../models/user-pattern-data.ts';

export class UserPatternService {
  
  private firestore = firebaseApp.firestore();

  /**
   * Adds a UserPatternData document to Firestore.
   */
  async addUserPatternData(userPatternData: UserPatternData): Promise<boolean> {
    try {
      const docRef = await this.firestore.collection("user_patterns").add(userPatternData.toFirestore());
      console.log("Document written with ID: ", docRef.id);
      return true;
    } catch (error) {
      console.error("Error adding document: ", error);
      return false;
    }
  }

  /**
   * Retrieves user patterns by user UUID.
   */
  async getUserPatternDataByUUID(user_uuid: string): Promise<UserPatternData[]> {
    try {
      const querySnapshot = await this.firestore.collection("user_patterns")
        .where("user_uuid", "==", user_uuid)
        .orderBy("createdAt", "desc")
        .get();

      const userPatterns = querySnapshot.docs.map((doc) => UserPatternData.fromFirestore(doc));
      return userPatterns;
    } catch (error) {
      console.error("Error getting documents: ", error);
      return [];
    }
  }

  /**
   * Retrieves user patterns by user UUID and website URL.
   */
  async getUserPatternDataByUUIDAndURL(user_uuid: string, website_url: string): Promise<UserPatternData[]> {
    try {
      const querySnapshot = await this.firestore.collection("user_patterns")
        .where("user_uuid", "==", user_uuid)
        .where("website_url", "==", website_url)
        .orderBy("createdAt", "desc")
        .get();

      const userPatterns = querySnapshot.docs.map((doc) => UserPatternData.fromFirestore(doc));
      return userPatterns;
    } catch (error) {
      console.error("Error getting documents: ", error);
      return [];
    }
  }
}