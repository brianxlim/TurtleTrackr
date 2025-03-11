
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDUuBuxFYTUNcXMuLXkxVM19ienayPgLyA",
  authDomain: "turtletrackr.firebaseapp.com",
  projectId: "turtletrackr",
  storageBucket: "turtletrackr.firebasestorage.app",
  messagingSenderId: "592370556619",
  appId: "1:592370556619:web:918423b76cb8aee46ac54e"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export default firebaseApp;