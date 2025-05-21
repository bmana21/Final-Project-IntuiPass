import React, { useEffect, useState } from 'react';

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
