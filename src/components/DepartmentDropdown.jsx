import React from "react";
import styles from "../styles/DepartmentDropdown.module.css";

export const DepartmentDropdown = () => {
  return (
    <div className={styles.dropdown}>
      <div className={styles.dropdownContent}>
        <div className={styles.dropdownHeader}>
          <div className={styles.dropdownText}>Department</div>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/a05e6c5f5cafbc0a446381bda4b9b2618e68d568e98019acc08bc54516d235ae?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
            className={styles.dropdownIcon}
            alt=""
          />
        </div>
        <div className={styles.divider} />
      </div>
    </div>
  );
};
