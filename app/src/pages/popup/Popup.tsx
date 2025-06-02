import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
// import { UserPatternService } from '../../services/firestore-service';
import { PasswordFieldManager } from '../../services/password-field-manager';
// import { UserPatternData } from '../../models/user-pattern-data';
// import { PatternType } from '../../models/pattern-type';
import { firebaseApp } from '../../firebase/firebase-config';

const Popup: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ command: "getAuthStatus" }, (response) => {
      if (response && response.isLoggedIn) {
        setUser(response.userData);
      }
    });
  }, []);

   const testFirebase = () => {
    const password_field_manager = new PasswordFieldManager();
    password_field_manager.fillPassword('test1234');

    // const firestore_service = new UserPatternService();
    // const create = async () => {
    //   const sample_data = new UserPatternData('LtJxTYcYlVcxHxRcBgJy4RMH4km1', PatternType.CONNECT_DOTS, 'google.com', 'abcd123', '000', 'aAbB');
    //   await firestore_service.addUserPatternData(sample_data);
    // };

    // create();

    // const retrieve = async () => {
    //   const user_data = await firestore_service.getUserPatternDataByUUID('LtJxTYcYlVcxHxRcBgJy4RMH4km1');
    //   console.log('user data is ', user_data);
    // }

    // retrieve();

    // const retrieve2 = async () => {
    //   const user_data = await firestore_service.getUserPatternDataByUUIDAndURL('LtJxTYcYlVcxHxRcBgJy4RMH4km1', 'google.com');
    //   console.log('user data 2 is ', user_data);
    // }

    // retrieve2();
  }

  const handleSignIn = () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Failed to get auth token", chrome.runtime.lastError);
        alert("Sign-in failed");
        return;
      }

      const tokenString = typeof token === 'string' ? token : token.token;
      
      if (!tokenString) {
        console.error("No valid token received");
        alert("Authentication failed - no token");
        return;
      }

      const credential = firebase.auth.GoogleAuthProvider.credential(null, tokenString);
      firebaseApp.auth().signInWithCredential(credential)
        .then((userCredential) => {
          if (userCredential.user) {
            setUser(userCredential.user);
            console.log("Signed in:", userCredential.user.email);
          } else {
            console.error("Sign in succeeded but no user data received");
          }
        })
        .catch((error) => {
          console.error("Firebase sign-in failed:", error);
          alert("Firebase sign-in failed: " + error.message);
        });
    });
  };


  const handleSignOut = () => {
    firebaseApp.auth().signOut()
      .then(() => {
        setUser(null);
        console.log("Signed out successfully");
      })
      .catch((error) => {
        console.error("Sign out failed:", error);
      });
  };

  return (
    <div id="root">
      <div id="content">
        {user ? (
          <div id="user-info">
            <img id="user-pic" src={user.photoURL || ''} alt="User Picture" />
            <p id="user-name">{user.displayName || "Unknown"}</p>
            <p id="user-email">{user.email || ""}</p>
            <button id="sign-out" onClick={handleSignOut}>Sign Out</button>
            <button onClick={testFirebase}>TEST!</button>
          </div>
        ) : (
          <div id="sign-in-section">
            <button id="sign-in" onClick={handleSignIn}>Sign In with Google</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
