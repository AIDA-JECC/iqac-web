import React, { useState } from "react";
import { getSubmissions, provideFeedback, approveSubmission } from "../services/questionPaperService";

const Dashboard = () => {
  const [feedback, setFeedback] = useState("");
  const submissions = getSubmissions();

  const handleFeedback = (id) => {
    provideFeedback(id, feedback);
    setFeedback("");
  };

  const handleApprove = (id) => {
    approveSubmission(id);
    alert("Submission approved!");
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {submissions.map((sub) => (
        <div key={sub.id}>
          <p>Subject Code: {sub.subjectCode}</p>
          <p>Course Name: {sub.courseName}</p>
          <p>Teacher Name: {sub.teacherName}</p>
          <p>Status: {sub.status}</p>
          {sub.feedback && <p>Feedback: {sub.feedback}</p>}
          <input
            type="text"
            placeholder="Provide Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <button onClick={() => handleFeedback(sub.id)}>Submit Feedback</button>
          <button onClick={() => handleApprove(sub.id)}>Approve</button>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
