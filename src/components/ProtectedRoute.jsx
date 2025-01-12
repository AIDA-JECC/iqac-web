import React from "react";
import { Navigate } from "react-router-dom";
//import { auth, db } from "../firebase"; // Firebase config
//import { doc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie";
const ProtectedRoute = ({ children, requiredRole }) => {
  //const user = auth.currentUser;
  const user = Cookies.get("userRole");

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/" />;
  }

  // Fetch user's role and validate access
  const fetchUserRole = () => {
    //const userDoc = await getDoc(doc(db, "users", user.email));
    //if (userDoc.exists()) {
    if (user) {
      //const userRole = userDoc.data().role;
      return user === requiredRole;
    }
    return false;
  };

  // If role does not match, redirect to login page
  if (!fetchUserRole()) {
    return <Navigate to="/" />;
  }

  return children; // Render the protected component if authenticated and role matches
};

export default ProtectedRoute;
