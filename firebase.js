// ─────────────────────────────────────────
//  firebase.js  —  Initialize Firebase ONCE
// ─────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyAOScHwYjbC6t4jFB6dQz6VNKYfoDUxT48",
  authDomain: "fir-firestore-database-a0cfc.firebaseapp.com",
  databaseURL: "https://fir-firestore-database-a0cfc-default-rtdb.firebaseio.com",
  projectId: "fir-firestore-database-a0cfc",
  storageBucket: "fir-firestore-database-a0cfc.firebasestorage.app",
  messagingSenderId: "585364414416",
  appId: "1:585364414416:web:f16adddd367843c1f763d5",
  measurementId: "G-2V1D0X5XM5"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth     = firebase.auth();
const db       = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();