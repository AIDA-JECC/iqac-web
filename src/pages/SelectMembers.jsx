import React, { useState, useEffect } from "react";
import { DropdownField } from "../components/DropdownFiled";
import { MemberTable } from "../components/MemberTable";
import styles from "./SelectMembers.module.css";
import { Sidebar } from "../components/Sidebar";
import { db } from "../firebase";
import { departmentsList } from "../services/questionPaperService";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";

// Create a new array with "All Departments" as the default option
const departmentOptions = ["All Departments", ...departmentsList];

export const SelectMembersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Initialize selectedUsers with users having scrutiny: true
        const initiallySelected = usersList
          .filter((user) => user.scrutiny === true)
          .map((user) => user.email);

        setUsers(usersList);
        setSelectedUsers(initiallySelected);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleDropdownChange = (title, value) => {
    setSelectedDepartment(value);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectUser = (email) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(email)
        ? prevSelectedUsers.filter((user) => user !== email) // Deselect user
        : [...prevSelectedUsers, email] // Select user
    );
  };

  const handleSubmit = async () => {
    try {
      const batch = writeBatch(db);

      users.forEach((user) => {
        const userDocRef = doc(db, "users", user.id);
        const shouldBeScrutiny = selectedUsers.includes(user.email);
        batch.update(userDocRef, { scrutiny: shouldBeScrutiny });
      });

      await batch.commit();
      alert("Scrutiny status updated successfully!");
    } catch (error) {
      console.error("Error updating scrutiny status:", error);
    }
  };

  // Filter users based on department and search term.
  // If "All Departments" is selected, show every user.
  const filteredUsers = users
    .filter((user) =>
      selectedDepartment === "All Departments"
        ? true
        : user.department === selectedDepartment
    )
    .filter((user) =>
      searchTerm
        ? user.name &&
          user.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.contentWrapper}>
        <Sidebar submission={[""]} />
        <div className={styles.mainColumn}>
          <div className={styles.mainContent}>
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
                placeholder="Search faculty..."
              />
            </div>
            <div className={styles.selectionSection}>
              <h1 className={styles.pageTitle}>Select Members</h1>
              <div className={styles.dropdownSection}>
                <DropdownField
                  key="Department"
                  title="Department"
                  options={departmentOptions}
                  selectedValue={selectedDepartment}
                  onChange={(value) =>
                    handleDropdownChange("Department", value)
                  }
                />
              </div>
              <div className={styles.tableSection}>
                <MemberTable
                  members={filteredUsers}
                  handleSelectUser={handleSelectUser}
                  selectedUsers={selectedUsers}
                />
                <button onClick={handleSubmit} className={styles.selectButton}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
