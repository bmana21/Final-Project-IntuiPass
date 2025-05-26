importScripts('../firebase/firebase-app.js');
importScripts('../firebase/firebase-auth.js');
importScripts('./firebase-config.js');

  
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed and background service worker running.");
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("User signed in:", user.email);
  } else {
    console.log("User signed out.");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "getAuthStatus") {
    const user = firebase.auth().currentUser;
    sendResponse({
      isLoggedIn: !!user,
      userData: user ? {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      } : null
    });
  }
  return true;
});