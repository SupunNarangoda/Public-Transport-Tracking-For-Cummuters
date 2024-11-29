import { getDatabase, ref, onValue } from "firebase/database";

export const countLocationIDs = async () => {
  const db = getDatabase();
  const locationsRef = ref(db, '/location'); // Adjust the path to your locations data

  return new Promise((resolve, reject) => {
    onValue(locationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const count = Object.keys(data).length;
        resolve(count);
      } else {
        resolve(0);
      }
    }, (error) => {
      reject(error);
    });
  });
};