if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

async function addUserPatternData(userPatternData) {
    try {
      const docRef = await db.collection("user_patterns").add(userPatternData.toFirestore());
      console.log("Document written with ID: ", docRef.id);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
}
  

async function getUserPatternDataByUUID(user_uuid) {
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

async function getUserPatternDataByUUIDAndURL(user_uuid, website_url) {
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
  
self.firestoreService = {
    addUserPatternData,
    getUserPatternDataByUUID,
    getUserPatternDataByUUIDAndURL
};