import React from 'react';
import styles from '../pages/TeacherFeedback.module.css';

export const FeedbackMessage = ({ message }) => {
  return (
    <div className={styles.feedbackMessage}>
      {message}
    </div>
  );
};