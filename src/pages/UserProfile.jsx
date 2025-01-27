import React from 'react';
import styles from './TeacherDashboard.module.css';

export const UserProfile = ({ name, email, avatar }) => (
  <div className={styles.profileContainer}>
    <img
      src={avatar}
      alt={`${name}'s profile`}
      className={styles.profileAvatar}
    />
    <div className={styles.profileInfo}>
      <div className={styles.profileName}>{name}</div>
      <div className={styles.profileEmail}>{email}</div>
    </div>
  </div>
);