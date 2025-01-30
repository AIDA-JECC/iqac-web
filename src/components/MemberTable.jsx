import React from "react";
import styles from "../pages/SelectMembers.module.css";

const extractName = (email) => {
  if (!email || typeof email !== "string") {
    console.error("Invalid email provided:", email);
    return "Unknown"; // Default value if email is invalid
  }

  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export const MemberTable = ({ members = [], handleSelectUser, selectedUsers }) => {
  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.headerColumn}>
          <div className={styles.headerText}>No.</div>
        </div>
        <div className={styles.headerColumn}>
          <div className={styles.headerText}>Name</div>
        </div>
        <div className={styles.headerColumn}>
          <div className={styles.headerText}>Department</div>
        </div>
        <div className={styles.headerColumn}>
          <div className={styles.headerText}>Action</div>
        </div>
      </div>
      {members.map((member, index) => (
        <div
          key={member.id}
          className={`${styles.tableRow} ${
            selectedUsers.includes(member.email) ? styles.selected : ""
          }`} // Add 'selected' class for selected users
        >
          <div className={styles.cell}>{index + 1}.</div>
          <div className={styles.cell}>{extractName(member.email)}</div>
          <div className={styles.cell}>{member.department}</div>
          <div className={styles.cell}>
            <button
              onClick={() => handleSelectUser(member.email)} // Handle user selection
              className={`${styles.actionButton} ${
                selectedUsers.includes(member.email) ? styles.selectedButton : ""
              }`} // Add selectedButton style when the user is selected
            >
              {selectedUsers.includes(member.email) ? "Selected" : "Select"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
