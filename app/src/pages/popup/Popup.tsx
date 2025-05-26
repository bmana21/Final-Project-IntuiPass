import React, { useEffect, useState } from 'react';
import { addUserPatternData, getUserPatternDataByUUID, getUserPatternDataByUUIDAndURL } from '../../services/firestore-service.ts';
import { UserPatternData } from '../../models/user-pattern-data.ts';
import { PatternType } from '../../models/pattern-type.ts';

declare global {
  interface Window {
    firebase: any;
  }
}

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
    const create = async () => {
      const sample_data = new UserPatternData('123', PatternType.CONNECT_DOTS, 'google.com', 'abcd123', '000', 'aAbB');
      await addUserPatternData(sample_data);
    };

    create();

    const retrieve = async () => {
      const user_data = await getUserPatternDataByUUID('123');
      console.log('user data is ', user_data);
    }

    retrieve();

    const retrieve2 = async () => {
      const user_data = await getUserPatternDataByUUIDAndURL('123', 'google.com');
      console.log('user data 2 is ', user_data);
    }

    retrieve2();
  }

  const handleSignIn = () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Failed to get auth token", chrome.runtime.lastError);
        alert("Sign-in failed");
        return;
      }

      const credential = window.firebase.auth.GoogleAuthProvider.credential(null, token);
      window.firebase.auth().signInWithCredential(credential)
        .then((userCredential: any) => {
          setUser(userCredential.user);
          console.log("Signed in:", userCredential.user.email);
        })
        .catch((error: any) => {
          console.error("Firebase sign-in failed:", error);
          alert("Firebase sign-in failed");
        });
    });
  };

  const handleSignOut = () => {
    window.firebase.auth().signOut().then(() => {
      setUser(null);
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
