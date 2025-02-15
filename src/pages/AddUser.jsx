import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AddUser.module.css";
import { Sidebar } from "../components/Sidebar.jsx";
import { getAllUsers,departmentsList } from "../services/questionPaperService";

import { deleteUser } from "../services/questionPaperService"; // Import the function

export const AddUser = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [faculties, setFaculties] = useState([
    { id: 1, email: "Leo", department: "AD" },
    { id: 2, email: "Naiz", department: "CSE" },
    { id: 3, email: "JEE", department: "CY" },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFaculties = async () => {
      const initialFaculties = await getAllUsers();
      console.log("users:", initialFaculties);
      setFaculties(initialFaculties);
      console.log(initialFaculties);
    };

    fetchFaculties();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
  };

  const handleNewFaculty = () => {
    // const newId = faculties.length + 1;
    // // const newFaculty = {
    // //   id: newId,
    // //   name: `New Faculty ${newId}`,
    // //   department: "TBD",
    // // };
    // setFaculties([...faculties, newFaculty]);
    navigate("/user/create");
  };

  // const handleDeleteFaculty = (id) => {
  //   setFaculties(faculties.filter((faculty) => faculty.id !== id));
  // };

  const handleDeleteFaculty = async (id) => {
    const success = await deleteUser(id);
    if (success) {
      setFaculties(faculties.filter((faculty) => faculty.id !== id));
    } else {
      console.error("Failed to delete user");
    }
  };

  const filteredFaculties = faculties.filter(
    (faculty) =>
      faculty.name && // Ensure name exists before calling toLowerCase()
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedDepartment === "" || faculty.department === selectedDepartment)
  );

  return (
    <div className={styles.selectionAdmin}>
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.contentInner}>
              <h1 className={styles.pageTitle}>Create New Faculty</h1>
              <div className={styles.actionBar}>
                <div className={styles.newFacultyBtn}>
                  <button className={styles.btnText} onClick={handleNewFaculty}>
                    New Faculty
                  </button>
                </div>
                <div className={styles.dropdownWrapper}>
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownInner}>
                      <div className={styles.dropdownContent}>
                        <select
                          className={styles.dropdownText}
                          value={selectedDepartment}
                          onChange={handleDepartmentChange}
                        >
                          <option value="">All Departments</option>
                          {departmentsList.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                        <img
                          src="https://cdn.builder.io/api/v1/image/assets/TEMP/a05e6c5f5cafbc0a446381bda4b9b2618e68d568e98019acc08bc54516d235ae?placeholderIfAbsent=true&apiKey=5b170d56c390428f8608efe1bd5e79f0"
                          className={styles.dropdownIcon}
                          alt=""
                        />
                      </div>
                      <div className={styles.dropdownDivider} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.searchBar}>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/5b721c51cd1dbfa107364f91ac0f35dce1314924d86917f8e707dacfa6000bfe?placeholderIfAbsent=true&apiKey=5b170d56c390428f8608efe1bd5e79f0"
                className={styles.searchIcon}
                alt=""
              />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search Faculties"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className={styles.facultyTable}>
              <div className={styles.tableColumn}>
                <div className={styles.tableHeader}>No.</div>
                {filteredFaculties.map((faculty, index) => (
                  <div key={faculty.id} className={styles.tableCell}>
                    {index + 1}.
                  </div>
                ))}
              </div>
              <div className={styles.tableColumn}>
                <div className={styles.tableHeader}>Name</div>
                {filteredFaculties.map((faculty) => (
                  <div key={faculty.id} className={styles.tableCell}>
                    {faculty.name}
                  </div>
                ))}
              </div>
              <div className={styles.tableColumn}>
                <div className={styles.tableHeader}>Department</div>
                {filteredFaculties.map((faculty) => (
                  <div key={faculty.id} className={styles.tableCell}>
                    {faculty.department}
                  </div>
                ))}
              </div>
              <div className={styles.actionColumn}>
                <div className={styles.actionHeader}>Action</div>
                {filteredFaculties.map((faculty) => (
                  <button
                    key={faculty.id}
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteFaculty(faculty.id)}
                  >
                    Delete
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
