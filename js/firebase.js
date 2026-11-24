// 1) أنشئ مشروع في console.firebase.google.com  2) فعّل Authentication (Email + Google) و Firestore
// 3) انسخ إعدادات الويب هنا
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArpAnrqY-Kxxou5-7KYZ-Vr3AWBek9Bls",
  authDomain: "janna-fdb07.firebaseapp.com",
  databaseURL: "https://janna-fdb07-default-rtdb.firebaseio.com",
  projectId: "janna-fdb07",
  storageBucket: "janna-fdb07.firebasestorage.app",
  messagingSenderId: "45218061168",
  appId: "1:45218061168:web:d12383889d50b9589c8db5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
