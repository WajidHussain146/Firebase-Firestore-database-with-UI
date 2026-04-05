// ═══════════════════════════════════════════════════
//  signup.js  —  Fixed: no duplicate auth conflict
// ═══════════════════════════════════════════════════

window.addEventListener("load", function () {

  const auth     = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const signupForm = document.getElementById("signupForm");
  const errorMsg   = document.getElementById("errorMsg");

  // ── If already logged in → skip to dashboard ──
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = "dashboard.html";
  });

  // ── Email / Password Signup ──
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMsg.innerText = "";

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email) { errorMsg.innerText = "Please enter your email."; return; }
    if (password.length < 6) { errorMsg.innerText = "Password must be at least 6 characters."; return; }

    auth.createUserWithEmailAndPassword(email, password)
      .then(() => { window.location.href = "dashboard.html"; })
      .catch((err) => {
        console.error("Signup error:", err.code, err.message);
        errorMsg.innerText = friendlyError(err.code);
      });
  });

  // ── Google Signup ──
  document.getElementById("googleSignup").addEventListener("click", () => {
    errorMsg.innerText = "";

    auth.signInWithPopup(provider)
      .then(() => { window.location.href = "dashboard.html"; })
      .catch((err) => {
        console.error("Google signup error:", err.code, err.message);
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

  function friendlyError(code) {
    const map = {
      "auth/email-already-in-use":   "This email is already registered. Try logging in.",
      "auth/invalid-email":          "Please enter a valid email address.",
      "auth/weak-password":          "Password must be at least 6 characters.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/unauthorized-domain":    "Domain not authorized — check Firebase Console."
    };
    return map[code] || "Error: " + code;
  }

});