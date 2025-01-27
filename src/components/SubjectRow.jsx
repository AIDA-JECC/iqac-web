import React from "react";
import styles from "../pages/TeacherDashboard.module.css";

export const SubjectRow = ({
  courseName,
  dept,
  date,
  status,
  statusColor,
  onViewClick,
}) => (
  <div className={styles.subjectRow}>
    <div className={styles.subjectTitle}>{courseName}</div>
    <div className={styles.departmentText}>{dept}</div>
    <div className={styles.dateText}>{date}</div>
    <div
      className={styles.statusBadge}
      style={{ backgroundColor: statusColor }}
      role="status"
    >
      {status}
    </div>
    <button
      onClick={onViewClick}
      className={styles.viewButton}
      aria-label={`View details for ${courseName}`}
    >
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/28aaaf3522f6bd77764a3287e92cc528244a991008090834538376696404b06e?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
        alt=""
        className={styles.viewIcon}
      />
    </button>
    <div className={styles.rowDivider} />
  </div>
);
