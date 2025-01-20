import { useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth, db } from "../firebase"; // Firebase configuration
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { doc, getDoc } from "firebase/firestore";
import styles from"./LoginPage.module.css"

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Function to fetch user role from Firestore
  const fetchUserRole = async (email) => {
    try {
      
      const userDoc = await getDoc(doc(db, "users", email));
      console.log("USER DATA:", userDoc)
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

  useEffect(() => {

    const redirect = async () => {

      const user = auth.currentUser;
      if (user) {
        const role = await fetchUserRole(user.email);
        if (role === "faculty") {
          navigate("/faculty");
        } else if (role === "admin") {
          navigate("/admin-dashboard");
        }
      }
    };

    redirect();
  }, [navigate]); // Dependency on navigate to run once on mount

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence); // Ensure persistence
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user) throw new Error("No user information returned.");

      const userRole = await fetchUserRole(user.email);
      if (userRole === "faculty") {
        navigate("/upload");
      } else if (userRole === "admin") {
        navigate("/admin-dashboard");
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
      await setPersistence(auth, browserLocalPersistence); // Ensure persistence
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      if (!user) throw new Error("No user information returned.");

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
    <div className={styles.LoginPage}>
      <img className={styles.LoginLft} src="src/assets/jec_grey.jpg" />
      <div className={styles.LoginCard}>
        <h5 className={styles.txt}>IQAC | JYOTHI</h5>
        <img className={styles.jecLogo} src="src/assets/jec_logo.png" />
  
        {/* Google Sign-In */}
  
        {/* Email/Password Login */}
        <form onSubmit={handleEmailPasswordLogin}>
          <div>
          <label> 
          <svg className={styles.user} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="12" cy="6" r="4" fill="#3d5ab8"></circle> <ellipse opacity="0.5" cx="12" cy="17" rx="7" ry="4" fill="#3d5ab8"></ellipse> </g></svg>            </label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
          <label>
              <svg className={styles.pass} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M5.25 10.0546V8C5.25 4.27208 8.27208 1.25 12 1.25C15.7279 1.25 18.75 4.27208 18.75 8V10.0546C19.8648 10.1379 20.5907 10.348 21.1213 10.8787C22 11.7574 22 13.1716 22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H8C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16C2 13.1716 2 11.7574 2.87868 10.8787C3.40931 10.348 4.13525 10.1379 5.25 10.0546ZM6.75 8C6.75 5.10051 9.10051 2.75 12 2.75C14.8995 2.75 17.25 5.10051 17.25 8V10.0036C16.867 10 16.4515 10 16 10H8C7.54849 10 7.13301 10 6.75 10.0036V8ZM14 16C14 17.1046 13.1046 18 12 18C10.8954 18 10 17.1046 10 16C10 14.8954 10.8954 14 12 14C13.1046 14 14 14.8954 14 16Z" fill="#3356c7"></path> </g></svg>
              </label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className={styles.LoginBtn} type="submit">
            Login
          </button>
  
          <h3>Or</h3>
  
          <div onClick={handleGoogleSignIn} className={styles.googleButton}>
            <div className={styles.googleIcon}></div>
            <span>Sign in with Google</span>
          </div>
        </form>
      </div>
    </div>
  );
  
}
  export default LoginPage;
  
