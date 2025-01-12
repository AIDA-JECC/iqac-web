import React, { useState, useEffect } from "react";
import {
  getSubmissions,
  provideFeedback,
  approveSubmission,
} from "../services/questionPaperService";

const Dashboard = () => {
  const [submissions, setSubmissions] = useState([]); // State to store submissions
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await getSubmissions();
        setSubmissions(data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    fetchSubmissions();
  }, []);

  const handleFeedbackChange = (id, value) => {
    setFeedback((prev) => ({
      ...prev,
      [id]: value, // Update feedback for the specific submission
    }));
  };

  const handleFeedback = async (id) => {
    try {
      console.log()
      const feedbacks = feedback[id]; // Get feedback for the specific submission
      if (!feedbacks) {
        alert("Please enter feedback before submitting!");
        return;
      }

      await provideFeedback(id, feedbacks); // Submit feedback
      alert("Feedback submitted!");
      setFeedback((prev) => ({
        ...prev,
        [id]: "", // Clear feedback input for this submission
      }));
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveSubmission(id); // Approve submission
      alert("Submission approved!");
    } catch (error) {
      console.error("Error approving submission:", error);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {submissions.length > 0 ? (
        submissions.map((sub) => (
          <div key={sub.id}>
            <p>Subject Code: {sub.subjectCode}</p>
            <p>Course Name: {sub.courseName}</p>
            <p>Teacher Name: {sub.teacherName}</p>
            <p>Status: {sub.status}</p>
            {sub.feedback && <p>Feedback: {sub.feedback}</p>}
            <input
              type="text"
              placeholder="Provide Feedback"
              value={feedback[sub.id] || ""}
              onChange={(e) =>  handleFeedbackChange(sub.id, e.target.value)}
            />
            <button onClick={() => handleFeedback(sub.id)}>
              Submit Feedback
            </button>
            <button onClick={() => handleApprove(sub.id)}>Approve</button>
          </div>
        ))
      ) : (
        <p>Loading submissions...</p>
      )}
    </div>
  );
};

export default Dashboard;
