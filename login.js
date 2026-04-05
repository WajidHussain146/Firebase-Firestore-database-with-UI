// ═══════════════════════════════════════════════════
//  login.js
// ═══════════════════════════════════════════════════

window.addEventListener("load", function () {

  const auth     = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const loginForm  = document.getElementById("loginForm");
  const errorMsg   = document.getElementById("errorMsg");
  const successMsg = document.getElementById("successMsg");

  // ── Already logged in → go to dashboard ──
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = "dashboard.html";
  });

  // ── Email / Password Login ──
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMsg.innerText  = "";
    successMsg.innerText = "";

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      errorMsg.innerText = "Please enter both email and password.";
      return;
    }

    auth.signInWithEmailAndPassword(email, password)
      .then(() => { window.location.href = "dashboard.html"; })
      .catch((err) => {
        console.error("Login error:", err.code, err.message);
        errorMsg.innerText = friendlyError(err.code);
      });
  });

  // ── Google Login ──
  document.getElementById("googleLogin").addEventListener("click", () => {
    errorMsg.innerText   = "";
    successMsg.innerText = "";

    auth.signInWithPopup(provider)
      .then(() => { window.location.href = "dashboard.html"; })
      .catch((err) => {
        console.error("Google login error:", err.code, err.message);
        if (err.code === "auth/popup-blocked") {
          auth.signInWithRedirect(provider);
        } else if (err.code === "auth/popup-closed-by-user") {
          errorMsg.innerText = "Sign-in cancelled.";
        } else {
          errorMsg.innerText = friendlyError(err.code);
        }
      });
  });

  // ── Handle redirect result ──
  auth.getRedirectResult()
    .then((result) => {
      if (result && result.user) window.location.href = "dashboard.html";
    })
    .catch((err) => {
      if (err.code && err.code !== "auth/no-auth-event") {
        errorMsg.innerText = friendlyError(err.code);
      }
    });

  // ── Forgot Password ──
  document.getElementById("forgotPasswordLink").addEventListener("click", (e) => {
    e.preventDefault();
    errorMsg.innerText   = "";
    successMsg.innerText = "";

    const email = document.getElementById("email").value.trim();

    if (!email) {
      errorMsg.innerText = "Please enter your email address above first.";
      document.getElementById("email").focus();
      return;
    }

    auth.sendPasswordResetEmail(email)
      .then(() => {
        successMsg.innerText = "✅ Password reset email sent! Check your inbox.";
      })
      .catch((err) => {
        console.error("Reset error:", err.code);
        if (err.code === "auth/user-not-found") {
          errorMsg.innerText = "No account found with this email.";
        } else if (err.code === "auth/invalid-email") {
          errorMsg.innerText = "Please enter a valid email address.";
        } else {
          errorMsg.innerText = "Could not send reset email. Try again.";
        }
      });
  });

  // ── Friendly error messages ──
  function friendlyError(code) {
    const map = {
      "auth/user-not-found":           "No account found with this email.",
      "auth/wrong-password":           "Incorrect password. Please try again.",
      "auth/invalid-email":            "Please enter a valid email address.",
      "auth/invalid-credential":       "Incorrect email or password.",
      "auth/invalid-login-credentials":"Incorrect email or password.",
      "auth/too-many-requests":        "Too many attempts. Try again later.",
      "auth/network-request-failed":   "Network error. Check your connection.",
      "auth/popup-closed-by-user":     "Google sign-in was cancelled.",
      "auth/cancelled-popup-request":  "Only one sign-in at a time.",
      "auth/unauthorized-domain":      "Domain not authorized — check Firebase Console."
    };
    return map[code] || "Error: " + code;
  }

});