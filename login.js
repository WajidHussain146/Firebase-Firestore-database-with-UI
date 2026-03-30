// ═══════════════════════════════════════════════════
//  login.js
// ═══════════════════════════════════════════════════

window.addEventListener("load", function () {

  const auth     = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const loginForm  = document.getElementById("loginForm");
  const errorMsg   = document.getElementById("errorMsg");

  // Already logged in → go to dashboard
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = "dashboard.html";
  });

  // ── Email / Password Login ──
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMsg.innerText = "";
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
      .then(() => { window.location.href = "dashboard.html"; })
      .catch((err) => { errorMsg.innerText = friendlyError(err.code); });
  });

  // ── Google Login ──
  document.getElementById("googleLogin").addEventListener("click", () => {
    errorMsg.innerText = "";

    auth.signInWithPopup(provider)
      .then(() => { window.location.href = "dashboard.html"; })
      .catch((err) => {
        // popup blocked — fall back to redirect
        if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
          auth.signInWithRedirect(provider);
        } else {
          errorMsg.innerText = friendlyError(err.code);
        }
      });
  });

  // Handle redirect result (for popup-blocked fallback)
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
      "auth/user-not-found":          "No account found with this email.",
      "auth/wrong-password":          "Incorrect password. Please try again.",
      "auth/invalid-email":           "Please enter a valid email address.",
      "auth/invalid-credential":      "Invalid email or password.",
      "auth/too-many-requests":       "Too many attempts. Try again later.",
      "auth/network-request-failed":  "Network error. Check your connection.",
      "auth/popup-closed-by-user":    "Google sign-in was cancelled.",
      "auth/cancelled-popup-request": "Only one sign-in popup at a time.",
      "auth/unauthorized-domain":     "This domain is not authorized in Firebase Console."
    };
    return map[code] || "Something went wrong. Please try again.";
  }

});