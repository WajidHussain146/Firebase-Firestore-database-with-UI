const firebaseConfig = { /* YOUR CONFIG */ };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const userEmailSpan = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

// Show logged-in user email
auth.onAuthStateChanged((user) => {
  if (user) {
    userEmailSpan.innerText = user.email;
  } else {
    window.location.href = "login.html"; // redirect if not logged in
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
});

// Initialize Firebase (same config above)

// DOM
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

// Check user
auth.onAuthStateChanged((user) => {
  if (user) {
    userEmail.innerText = user.email;
  } else {
    window.location.href = "login.html";
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
});

const firebaseConfig = {
  apiKey: "AIzaSyAOScHwYjbC6t4jFB6dQz6VNKYfoDUxT48",
  authDomain: "fir-firestore-database-a0cfc.firebaseapp.com",
  databaseURL: "https://fir-firestore-database-a0cfc-default-rtdb.firebaseio.com",
  projectId: "fir-firestore-database-a0cfc",
  storageBucket: "fir-firestore-database-a0cfc.appspot.com",
  messagingSenderId: "585364414416",
  appId: "1:585364414416:web:f16adddd367843c1f763d5"
};