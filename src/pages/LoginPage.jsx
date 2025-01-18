import React, { useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { doc, getDoc } from "firebase/firestore";

import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const fetchUserRole = async (email) => {
    try {
      const userDoc = await getDoc(doc(db, "users", email));
      if (userDoc.exists()) {
        return userDoc.data().role;
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

  useEffect(() => {
    const redirect = async () => {
      const user = auth.currentUser;
      if (user) {
        const role = await fetchUserRole(user.email);
        if (role === "faculty") {
          navigate("/upload");
        } else if (role === "admin") {
          navigate("/admin-dashboard");
        }
      }
    };
    redirect();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRole = await fetchUserRole(user.email);
      if (userRole === "faculty") {
        navigate("/upload");
      } else if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else {
        toast.error("Unauthorized role.");
        await signOut(auth);
      }
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      toast.error("Google Sign-In failed. Please try again.");
    }
  };

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userRole = await fetchUserRole(email);
      if (userRole === "faculty") {
        navigate("/upload");
      } else if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else {
        toast.error("Unauthorized role.");
        await signOut(auth);
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
    <div className={styles.container}>
      <div className={styles.mainContainer}>
        <div className={styles.leftDiv}>
          {/* Optional content for the left section */}
        </div>
        <div className={styles.rightDiv}>
          <div className={styles.topSection}>
            <h1 className={styles.loginTitle}>Login</h1>
          </div>
          <div className={styles.bottomSection}>
            {/* Logo */}
            <div className={styles.logo}>
              <img src="/logo.png" alt="Company Logo" />
            </div>

            {/* Social Buttons */}
            <div className={styles.socialButtons}>
              {/* Google Sign-In */}
<button className={styles.roundButton} onClick={handleGoogleSignIn}>
  <img 
    src="data:image/jpeg;base64,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" 
    alt="Google Logo" 
    className={styles.googleLogo} 
  />
</button>

            </div>

            <p className={styles.orText}>or</p>

            {/* Email/Password Login Form */}
            <form className={styles.form} onSubmit={handleEmailPasswordLogin}>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button className={styles.continueButton} type="submit">
                Continue
              </button>
            </form>

            {/* Signup Section */}
            <p className={styles.signupText}>
              Don’t have an account? <a href="/signup">Sign up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
