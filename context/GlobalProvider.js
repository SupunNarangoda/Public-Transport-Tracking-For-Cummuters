import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";


const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState({ name: "Guest", email: "", photoURL: "" }); 
  const [userId, setUserId] = useState("Unknown User"); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || "Guest",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg",
        });
        setUserId(firebaseUser.uid || "Unknown User");
        setIsLogged(true);
      } else {
        setUser({ name: "Guest", email: "", photoURL: "" });
        setUserId("Unknown User");
        setIsLogged(false);
      }
      setLoading(false);
    });
  }, []);

  return (
    <GlobalContext.Provider
      value={{ isLogged, setIsLogged, user, setUserId, setUser, userId, loading }}
    >
      {children}
    </GlobalContext.Provider>
  );
};


export default GlobalProvider;
