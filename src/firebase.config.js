// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database'; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAvNCQS4HWBsB90yWczercG_BamGYqvgQ",
  authDomain: "arduino-fed1f.firebaseapp.com",
  databaseURL: "https://arduino-fed1f-default-rtdb.firebaseio.com",
  projectId: "arduino-fed1f",
  storageBucket: "arduino-fed1f.appspot.com",
  messagingSenderId: "1013250696842",
  appId: "1:1013250696842:web:2e6dc3e9741d7c16f6ef73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app); // Initialize Realtime Database

export { db }; // Export the 'db' variable
