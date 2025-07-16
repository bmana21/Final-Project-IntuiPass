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

  /**
   * Deletes a user pattern by its UUID.
   */
  async deleteUserPatternData(pattern_uuid: string): Promise<boolean> {
    try {
      const currentUser = firebaseApp.auth().currentUser;
      if (!currentUser) {
        console.error("No authenticated user");
        return false;
      }

      const querySnapshot = await this.firestore.collection("user_patterns")
          .where("user_uuid", "==", currentUser.uid)
          .where("uuid", "==", pattern_uuid)
          .get();

      if (querySnapshot.empty) {
        console.warn("No document found with UUID: ", pattern_uuid);
        return false;
      }

      const batch = this.firestore.batch();
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log("Document(s) successfully deleted with UUID: ", pattern_uuid);
      return true;
    } catch (error) {
      console.error("Error deleting document: ", error);
      return false;
    }
  }
}