// ─────────────────────────────────────────
//  firebase.js  —  Initialize Firebase ONCE
//  DO NOT declare auth/db/provider here —
//  each page's own JS file handles that.
// ─────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "AIzaSyAOScHwYjbC6t4jFB6dQz6VNKYfoDUxT48",
  authDomain:        "fir-firestore-database-a0cfc.firebaseapp.com",
  databaseURL:       "https://fir-firestore-database-a0cfc-default-rtdb.firebaseio.com",
  projectId:         "fir-firestore-database-a0cfc",
  storageBucket:     "fir-firestore-database-a0cfc.appspot.com",
  messagingSenderId: "585364414416",
  appId:             "1:585364414416:web:f16adddd367843c1f763d5"
};

// Initialize only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}