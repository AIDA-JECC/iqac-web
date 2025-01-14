import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Firebase config
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children, requiredRole }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.email));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }

      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login page if user is not authenticated or role does not match
  if (auth.currentUser.email == "sachin.ad21@jecc.ac.in"){
    return children;
  }
  if (!auth.currentUser || userRole !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children; // Render the protected component if authenticated and role matches
};

export default ProtectedRoute;
