document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("user-info");
  const signInSection = document.getElementById("sign-in-section");
  const signInBtn = document.getElementById("sign-in");
  const signOutBtn = document.getElementById("sign-out");
  const userPic = document.getElementById("user-pic");
  const userName = document.getElementById("user-name");
  const userEmail = document.getElementById("user-email");

  chrome.runtime.sendMessage({ command: "getAuthStatus" }, (response) => {
    if (response && response.isLoggedIn) {
      showUserInfo(response.userData);
    } else {
      showSignIn();
    }
  });

  signInBtn.addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Failed to get auth token", chrome.runtime.lastError);
        alert("Sign-in failed");
        return;
      }
  
      const credential = firebase.auth.GoogleAuthProvider.credential(null, token);
      firebase.auth().signInWithCredential(credential)
        .then((userCredential) => {
          showUserInfo(userCredential.user);
          console.log("Signed in:", userCredential.user.email);
        })
        .catch((error) => {
          console.error("Firebase sign-in failed:", error);
          alert("Firebase sign-in failed");
        });
    });
  });

  signOutBtn.addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      showSignIn();
    });
  });

  function showUserInfo(user) {
      signInSection.classList.add("hidden");
      userInfo.classList.remove("hidden");

      userPic.src = user.photoURL || "";
      userName.textContent = user.displayName || "Unknown";
      userEmail.textContent = user.email || "";
  }

  function showSignIn() {
    userInfo.classList.add("hidden");
    signInSection.classList.remove("hidden");
  }
});