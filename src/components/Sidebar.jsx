import React, { useState, useEffect } from "react";
import styles from "../pages/TeacherDashboard.module.css";
import { UserProfile } from "../pages/UserProfile";
import { StatusItem } from "./StatusItem";
import { auth, db } from "../firebase"; // Assuming you have firestore set up
import { STATUS_COLORS, BUTTON_COLORS } from "../pages/types";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore"; // Firestore imports

const extractName = (email) => {
  if (!email || typeof email !== "string") {
    console.error("Invalid email provided:", email);
    return "Unknown"; // Default value if email is invalid
  }

  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export const Sidebar = ({ submissions }) => {
  const navigate = useNavigate();
  const [isScrutiny, setIsScrutiny] = useState(false);

  // Check the user's role in Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = auth.currentUser.email;
        if (user) {
          const userDocRef = doc(db, "users", user); // Assuming 'users' is the collection
          const userDocSnap = await getDoc(userDocRef);
          console.log("CHECK:", userDocSnap.data());

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.scrutiny === true) {
              setIsScrutiny(true);
            } else {
              setIsScrutiny(false);
            }
          } else {
            console.log("No user data found.");
          }
        }
      } catch (error) {
        console.error("Error fetching user role from Firestore:", error);
      }
    };

    fetchUserRole();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth); // Sign out the user
      navigate("/", { replace: true });
      window.location.reload(); // Redirect to login page
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const statusItems = [
    {
      color: STATUS_COLORS.PENDING,
      label: "Pending",
      count: (submissions || []).filter((item) => item?.status === "Pending")
        .length,
    },
    {
      color: STATUS_COLORS.APPROVED,
      label: "Approved",
      count: (submissions || []).filter((item) => item?.status === "Approved")
        .length,
    },
    {
      color: STATUS_COLORS.REJECTED,
      label: "Rejected",
      count: (submissions || []).filter((item) => item?.status === "Rejected")
        .length,
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <div className={styles.username}>IQAC</div>
        <UserProfile
          name={extractName(auth.currentUser.email)}
          email={auth.currentUser.email}
          avatar="https://cdn.builder.io/api/v1/image/assets/TEMP/ecb316b8df04291c82ea9e0c1fcd35729f0087a0d2f8dd891f88c86656d6b87f?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
        />
        <nav className={styles.sidebarNav}>
          {/* Conditionally render the Scrutiny Dashboard button */}
          {isScrutiny && (
            <button
              className={styles.navItem}
              onClick={() => navigate("/scrutiny")}
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/985611777b53d928491f2353d15659e64203949de2847ad589ca9ecafbf36834?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
                alt=""
                className={styles.navIcon}
              />
              <span>Scrutiny Dashboard</span>
            </button>
          )}
          <button
            className={styles.navItemActive}
            onClick={() => navigate("/faculty")}
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/4afa34f9942cce8f2dfa4f565621da02962b9d655c867c56ed7b771382723c2e?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
              alt=""
              className={styles.navIcon}
            />
            <span>View Submissions</span>
          </button>
        </nav>

        {statusItems.map((item, index) => (
          <StatusItem key={index} {...item} />
        ))}

        <div className={styles.sidebarFooter}>
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/fa111f5bad02979d542f0fd932aa82ea41f5bc99818bb5ae9de91fdbbf76fa20?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
            alt=""
            className={styles.footerIcon}
            onClick={handleSignOut}
          />
          <span>{auth.currentUser.email}</span>
        </div>
      </div>
    </aside>
  );
};
