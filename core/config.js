import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";


export const FIREBASE_CONFIG = {
    // apiKey: "AIzaSyDlRa9_JJK20JpxY7rQk36bikgBh3ltNE8",
    // authDomain: "public-transport-trackin-1e029.firebaseapp.com",
    // projectId: "public-transport-trackin-1e029",
    // storageBucket: "public-transport-trackin-1e029.appspot.com",
    // messagingSenderId: "246197865718",
    // appId: "1:246197865718:web:ba639756bbfeffb63af0d7",
    // measurementId: "G-Q0TQF8H03H",
    apiKey: "AIzaSyDlRa9_JJK20JpxY7rQk36bikgBh3ltNE8",
    authDomain: "public-transport-trackin-1e029.firebaseapp.com",
    databaseURL: "https://public-transport-trackin-1e029-default-rtdb.firebaseio.com",
    projectId: "public-transport-trackin-1e029",
    storageBucket: "public-transport-trackin-1e029.appspot.com",
    messagingSenderId: "246197865718",
    appId: "1:246197865718:web:ba639756bbfeffb63af0d7",
    measurementId: "G-Q0TQF8H03H"
  }

const app = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(app);

export { database };