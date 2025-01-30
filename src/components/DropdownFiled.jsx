import React from "react";
import styles from "./DropdownField.module.css";

export const DropdownField = ({ title, options, selectedValue, onChange }) => {
  return (
    <div className={styles.dropdownContainer}>
      <label className={styles.dropdownLabel}>{title}:</label>
      <select
        className={styles.dropdown}
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.value}
          </option>
        ))}
      </select>
    </div>
  );
};
