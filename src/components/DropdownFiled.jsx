import React from 'react';
import styles from './DropdownField.module.css';

export const DropdownField = ({ title, value, icon }) => {
  return (
    <div className={styles.dropdownContainer}>
      <div className={styles.textEditWrapper}>
        <div className={styles.fieldTitle}>{title}</div>
        <div className={styles.dropdownContent}>
          <div>{value}</div>
          <img
            loading="lazy"
            src={icon}
            className={styles.dropdownIcon}
            alt=""
          />
        </div>
        <div className={styles.divider} />
      </div>
    </div>
  );
};