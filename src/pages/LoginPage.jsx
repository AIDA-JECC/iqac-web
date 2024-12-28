import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase"; // Firebase configuration
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { doc, getDoc } from "firebase/firestore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Function to fetch user role from Firestore
  const fetchUserRole = async (email) => {
    try {
      const userDoc = await getDoc(doc(db, "users", email));
      if (userDoc.exists()) {
        return userDoc.data().role; // Return the user's role
      } else {
        toast.error("User role not found in Firestore.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      toast.error("Error fetching user role. Please try again.");
      return null;
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRole = await fetchUserRole(user.email);
      if (userRole === "faculty") {
        navigate("/upload");
      } else if (userRole === "admin") {
        navigate("/admin-dashboard"); // Replace with your admin page route
      } else {
        toast.error("Unauthorized role.");
        await signOut(auth); // Sign out unauthorized users
      }
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      toast.error("Google Sign-In failed. Please try again.");
    }
  };

  // Email/Password Login
  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();

    try {
      // Authenticate the user
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const userRole = await fetchUserRole(email);
      if (userRole === "faculty") {
        navigate("/upload");
      } else if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else {
        toast.error("Unauthorized role.");
        await signOut(auth); // Sign out unauthorized users
      }
    } catch (error) {
      console.error("Error during Email/Password Login:", error);
      if (error.code === "auth/user-not-found") {
        toast.error("User not found. Please check your email.");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Invalid password. Please try again.");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    }
  };

  return (
    <div>
      <h1>Login</h1>

      {/* Google Sign-In */}
      <button onClick={handleGoogleSignIn}>Sign in with Google</button>

      {/* Email/Password Login */}
      <form onSubmit={handleEmailPasswordLogin}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login with Email</button>
      </form>
    </div>
  );
};

export default LoginPage;
