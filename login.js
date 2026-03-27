const firebaseConfig = {
  apiKey: "AIzaSyAOScHwYjbC6t4jFB6dQz6VNKYfoDUxT48",
  authDomain: "fir-firestore-database-a0cfc.firebaseapp.com",
  databaseURL: "https://fir-firestore-database-a0cfc-default-rtdb.firebaseio.com",
  projectId: "fir-firestore-database-a0cfc",
  storageBucket: "fir-firestore-database-a0cfc.appspot.com",
  messagingSenderId: "585364414416",
  appId: "1:585364414416:web:f16adddd367843c1f763d5"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

// Email Login
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      errorMsg.innerText = error.message;
    });
});

// Google Login
document.getElementById("googleLogin").addEventListener("click", () => {
  auth.signInWithPopup(provider)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      errorMsg.innerText = error.message;
    });
});