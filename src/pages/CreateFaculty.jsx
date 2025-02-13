import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreateFaculty.module.css";
import { createUser } from "../services/questionPaperService";

export const CreateFaculty = () => {
  const [name, setName] = useState("Bineesh");
  const [email, setEmail] = useState("Bineesh.ad@jecc.ac.in");
  const [department, setDepartment] = useState("AD");
  const [role, setRole] = useState("faculty");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitted:", { name, email, department, role });

   const userId = email
    const success = await createUser(userId, email, name, department, role);

    if (success) {
      navigate("/add-user");
    } else {
      alert("Failed to create user. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/6d53af9af6a4e53d74d06edc1f3049266467905105dc543ead92f679583e8d6c?apiKey=5b170d56c390428f8608efe1bd5e79f0&"
        alt="Close"
        className={styles.closeIcon}
      />
      <div className={styles.contentWrapper}>
        <h1 className={styles.title}>Create New Faculty</h1>
        <form onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.label}>Name</label>
            <input
              type="text"
              className={styles.value}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className={styles.divider} />
          <div className={styles.formField}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.value}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.divider} />
          <div className={styles.dropdownContainer}>
            <div className={styles.dropdownWrapper}>
              <div className={styles.dropdown}>
                <div className={styles.dropdownInner}>
                  <div className={styles.dropdownContent}>
                    <div className={styles.dropdownTextEdit}>
                      <label className={styles.dropdownTitle}>Department</label>
                      <select
                        className={styles.dropdownSelection}
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      >
                        <option value="AD">AD</option>
                        <option value="EC">EC</option>
                        <option value="EEE">EEE</option>
                        <option value="MR">MR</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.dropdownWrapper}>
              <div className={styles.dropdown}>
                <div className={styles.dropdownInner}>
                  <div className={styles.dropdownContent}>
                    <div className={styles.dropdownTextEdit}>
                      <label className={styles.dropdownTitle}>Role</label>
                      <select
                        className={styles.dropdownSelection}
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="faculty">faculty</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button type="submit" className={styles.submitButton}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateFaculty;
