import React, { useState, useEffect } from "react";
import { DropdownField } from "../components/DropdownFiled";
import { MemberTable } from "../components/MemberTable";
import styles from "./SelectMembers.module.css";
import { Sidebar } from "../components/Sidebar";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { departmentsList } from "../services/questionPaperService";

export const SelectMembersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(departmentsList[0]); // Default to first department
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
    setSelectedUsers(
      (prevSelectedUsers) =>
        prevSelectedUsers.includes(email)
          ? prevSelectedUsers.filter((user) => user !== email) // Deselect user
          : [...prevSelectedUsers, email] // Select user
    );
  };

  const handleSubmit = async () => {
    try {
      const batch = writeBatch(db);

      users.forEach((user) => {
        // Use Firestore document ID instead of email if different
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

  const filteredUsers = users
    .filter((user) =>
      selectedDepartment ? user.department === selectedDepartment : true
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
                  title="Department"
                  options={departmentsList}
                  selectedValue={selectedDepartment}
                  onChange={handleDropdownChange}
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
