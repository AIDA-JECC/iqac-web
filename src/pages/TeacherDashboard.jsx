import React, { useState, useEffect } from "react";
import styles from "./TeacherDashboard.module.css";
import { StatusItem } from "../components/StatusItem";
import { SubjectRow } from "../components/SubjectRow";
import { UserProfile } from "./UserProfile";
import { STATUS_COLORS, BUTTON_COLORS } from "./types";

// for signout function
import { signOut } from "firebase/auth";

import { db, auth } from "../firebase"; // Firebase configuration
import { addDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSubmissionsByTeacher,
  getSubmissionsByStausAndEmail,
} from "../services/questionPaperService";

const extractName = (email) => {
  if (!email || typeof email !== "string") {
    console.error("Invalid email provided:", email);
    return "Unknown"; // Default value if email is invalid
  }

  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export const TeacherDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [subjectCode, setSubjectCode] = useState("");
  const [department, setDepartment] = useState("");
  const [courseName, setCourseName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [file, setFile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // await updateUserRole(auth.currentUser.email)
        const data = await getSubmissionsByTeacher(auth.currentUser.email);
        //console.log("TEST appproved:",await getSubmissionsByStausAndEmail(auth.currentUser.email,"Approved"))
        console.log(auth.currentUser);

        console.log(extractName(auth.currentUser.email));

        console.log("Previous teacher data: ", data);
        setSubmissions(data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    fetchSubmissions();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleFilterOptions = () => {
    setShowFilterOptions((prev) => !prev);
  };

  const handleFilterClick = (status) => {
    setFilterStatus(status === filterStatus ? "" : status); // Toggle filter
  };

  const filteredSubjects = submissions.filter((row) => {
    const matchesSearch = row.courseName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus
      ? row.status.toLowerCase() === filterStatus.toLowerCase()
      : true;

    return matchesSearch && matchesFilter;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!file) {
        toast.error("Please upload a file!");
        return;
      }

      // Add metadata to Firestore
      const docRef = await addDoc(collection(db, "uploads"), {
        subjectCode,
        courseName,
        teacherName,
        fileName: file.name,
        uploadedBy: auth.currentUser.email,
        status: "Pending",
        dept: department,
        uploadedAt: new Date(),
      });

      toast.success("File uploaded successfully!");
      console.log("Document written with ID: ", docRef.id);

      // Reset form
      setSubjectCode("");
      setCourseName("");
      setTeacherName("");
      setDepartment("");
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Upload failed. Please check your permissions.");
    }
  };

  const getStatus = (status) => {
    if (status === "Pending") {
      return <h3 className={styles.orange}>Pending</h3>;
    } else if (status === "Approved") {
      return <h3 className={styles.green}>Approved</h3>;
    } else if (status === "Rejected") {
      return <h3 className={styles.red}>Rejected</h3>;
    }
  };

  const statusItems = [
    {
      color: STATUS_COLORS.PENDING,
      label: "Pending",
      count: submissions.filter((item) => item.status === "Pending").length,
    },
    {
      color: STATUS_COLORS.APPROVED,
      label: "Approved",
      count: submissions.filter((item) => item.status === "Approved").length,
    },
    {
      color: STATUS_COLORS.REJECTED,
      label: "Rejected",
      count: submissions.filter((item) => item.status === "Rejected").length,
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth); // Sign out the user
      navigate("/", { replace: true });
      window.location.reload(); // Redirect to login page
      toast.success("You have been signed out!");
    } catch (error) {
      console.error("Error during sign out:", error);
      toast.error("Sign out failed. Please try again.");
    }
  };

  const handleViewClick = (id) => {


    // Navigate to the desired page with the ID
    navigate(`/view/${id}`);
  };

  // const filteredSubjects = submissions.filter((row) =>
  //   row.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.contentWrapper}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <div className={styles.username}>IQAC</div>
            <UserProfile
              name={extractName(auth.currentUser.email)}
              email={auth.currentUser.email}
              avatar="https://cdn.builder.io/api/v1/image/assets/TEMP/ecb316b8df04291c82ea9e0c1fcd35729f0087a0d2f8dd891f88c86656d6b87f?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
            />
            <nav className={styles.sidebarNav}>
              <button className={styles.navItem}>
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/985611777b53d928491f2353d15659e64203949de2847ad589ca9ecafbf36834?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
                  alt=""
                  className={styles.navIcon}
                />
                <span>Menu</span>
              </button>
              <button className={styles.navItemActive}>
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/4afa34f9942cce8f2dfa4f565621da02962b9d655c867c56ed7b771382723c2e?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
                  alt=""
                  className={styles.navIcon}
                />
                <span>Status</span>
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
              />
              <span>{auth.currentUser.email}</span>
            </div>
          </div>
        </aside>

        <main className={styles.mainContent}>
          <h1 className={styles.welcomeTitle}>Welcome</h1>
          <div className={styles.signoutContainer}>
            <button className={styles.signout} onClick={handleSignOut}>
              Sign Out
            </button>
          </div>

          <div className={styles.searchBar}>
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/a5ef37c1f4a762bb85c575ec41d9a1fe00a7c131a395823f167cc0d1e9678054?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
              alt=""
              className={styles.searchIcon}
            />
            <input
              type="search"
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
              placeholder="Search papers..."
              aria-label="Search papers"
            />
          </div>

          <div className={styles.actionButtons}>
            <button
              className={styles.addButton}
              aria-label="Add new item"
              onClick={() => navigate("/upload")}
            >
              +
            </button>
            <button
              className={styles.filterButton}
              aria-label="Filter items"
              onClick={toggleFilterOptions}
            >
              Filter
            </button>
          </div>
          {showFilterOptions && (
            <div className={styles.filterOptions}>
              <button
                className={`${styles.filterOption} ${
                  filterStatus === "Pending" ? styles.activeFilter : ""
                }`}
                onClick={() => handleFilterClick("Pending")}
              >
                Pending
              </button>
              <button
                className={`${styles.filterOption} ${
                  filterStatus === "Approved" ? styles.activeFilter : ""
                }`}
                onClick={() => handleFilterClick("Approved")}
              >
                Approved
              </button>
              <button
                className={`${styles.filterOption} ${
                  filterStatus === "Rejected" ? styles.activeFilter : ""
                }`}
                onClick={() => handleFilterClick("Rejected")}
              >
                Rejected
              </button>
            </div>
          )}

          <div className={styles.tableHeader} role="rowheader">
            <div className={styles.headerCell}>Subject</div>
            <div className={styles.headerCell}>Dept/sem</div>
            <div className={styles.headerCell}>Date</div>
            <div className={styles.headerCell}>Status</div>
            <div className={styles.headerCell}>View</div>
          </div>

          <div className={styles.tableContent} role="table">
            {filteredSubjects.map((row, index) => (
              <SubjectRow
                key={index}
                {...row}
                onViewClick={() => handleViewClick(row.id)}
                statusColor={
                  row.status === "Approved"
                    ? STATUS_COLORS.APPROVED
                    : row.status === "Rejected"
                    ? STATUS_COLORS.REJECTED
                    : STATUS_COLORS.PENDING
                }
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
