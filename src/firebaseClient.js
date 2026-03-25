import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCG7wj0SjLSIm8C0eLDGKZV9mdyDuOdXwM",
  authDomain: "workshop-genai-477501.firebaseapp.com",
  databaseURL: "https://workshop-genai-477501-default-rtdb.firebaseio.com",
  projectId: "workshop-genai-477501",
  storageBucket: "workshop-genai-477501.firebasestorage.app",
  messagingSenderId: "471218709027",
  appId: "1:471218709027:web:02176809f94745617a0796",
  measurementId: "G-P6WQYJJRFP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);