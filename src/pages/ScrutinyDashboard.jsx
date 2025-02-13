import React, { useState, useEffect } from "react";
import styles from "./TeacherDashboard.module.css";
import { SubjectRow } from "../components/SubjectRow";
import { STATUS_COLORS, BUTTON_COLORS } from "./types";
import { signOut } from "firebase/auth";
import {auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSubmissionsByDepartment,
  getUserDepartment,
} from "../services/questionPaperService";
import { Sidebar } from "../components/Sidebar";

const extractName = (email) => {
  if (!email || typeof email !== "string") {
    console.error("Invalid email provided:", email);
    return "Unknown"; // Default value if email is invalid
  }

  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export const ScrutinyDashboard = () => {
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
        const dept = await getUserDepartment(auth.currentUser.email)
        const data = await getSubmissionsByDepartment(dept);
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
    navigate(`/scrutiny/view/${id}`);
  };

  // const filteredSubjects = submissions.filter((row) =>
  //   row.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.contentWrapper}>
        <Sidebar submissions={submissions} />

        <main className={styles.mainContent}>
          <h1 className={styles.welcomeTitle}>ScrutinyDashboard</h1>
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

export default ScrutinyDashboard;
