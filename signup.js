// ═══════════════════════════════════════════════════
//  signup.js
// ═══════════════════════════════════════════════════

window.addEventListener("load", function () {

  const auth     = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const signupForm = document.getElementById("signupForm");
  const errorMsg   = document.getElementById("errorMsg");

  // Already logged in → go to dashboard
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = "dashboard.html";
  });

  // ── Email / Password Signup ──
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMsg.innerText = "";
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (password.length < 6) {
      errorMsg.innerText = "Password must be at least 6 characters.";
      return;
    }

    auth.createUserWithEmailAndPassword(email, password)
      .then(() => { window.location.href = "dashboard.html"; })
      .catch((err) => { errorMsg.innerText = friendlyError(err.code); });
  });

  // ── Google Signup ──
  document.getElementById("googleSignup").addEventListener("click", () => {
    errorMsg.innerText = "";

    auth.signInWithPopup(provider)
      .then(() => { window.location.href = "dashboard.html"; })
      .catch((err) => {
        if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
          auth.signInWithRedirect(provider);
        } else {
          errorMsg.innerText = friendlyError(err.code);
        }
      });
  });

  // Handle redirect result
  auth.getRedirectResult()
    .then((result) => {
      if (result && result.user) window.location.href = "dashboard.html";
    })
    .catch((err) => {
      if (err.code && err.code !== "auth/no-auth-event") {
        errorMsg.innerText = friendlyError(err.code);
      }
    });

  function friendlyError(code) {
    const map = {
      "auth/email-already-in-use":    "This email is already registered.",
      "auth/invalid-email":           "Please enter a valid email address.",
      "auth/weak-password":           "Password must be at least 6 characters.",
      "auth/network-request-failed":  "Network error. Check your connection.",
      "auth/popup-closed-by-user":    "Google sign-in was cancelled.",
      "auth/unauthorized-domain":     "This domain is not authorized in Firebase Console."
    };
    return map[code] || "Something went wrong. Please try again.";
  }

});