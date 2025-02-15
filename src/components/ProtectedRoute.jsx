import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "../App.css";

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
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
    return <div className="Loader">
      <div>Loading...</div><div className="loading-spinner"></div>
    </div>;
  }

  // Ensure requiredRoles is always an array and check if userRole is included
  if (!auth.currentUser || !Array.isArray(requiredRoles) || !requiredRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;



// Redirect to login page if user is not authenticated or role does not match
// if (auth.currentUser.email == "sachin.ad21@jecc.ac.in") {
//   return children;
// }