import React from 'react';
import styles from "../pages/TeacherDashboard.module.css";

export const StatusItem = ({ color, label, count }) => (
  <div className={styles.statusContainer}>
    <div className={styles.statusWrapper}>
      <div 
        className={styles.statusCircle} 
        style={{borderColor: color}}
        role="status"
        aria-label={`${label} status indicator`}
      />
      <div className={styles.statusLabel}>{label}</div>
    </div>
    <div className={styles.statusCount} aria-label={`${count} items`}>
      {count}
    </div>
  </div>
);