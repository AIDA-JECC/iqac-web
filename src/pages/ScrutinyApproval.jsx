import { useState, useEffect, useRef } from "react";
import styles from "./Upload.module.css";
import { db, auth } from "../firebase"; // Firebase configuration
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Worker, Viewer } from "@react-pdf-viewer/core"; // Import PDF Viewer
import "@react-pdf-viewer/core/lib/styles/index.css"; // Core styles
import "@react-pdf-viewer/default-layout/lib/styles/index.css"; // Default layout styles
import {
  getBySubmissionId,
  approveSubmission,
  provideFeedback,
} from "../services/questionPaperService.js";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";

const extractName = (email) => {
  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export const ScrutinyApproval = () => {
  const { id } = useParams();
  const [feedbackMessages, setFeedbackMessages] = useState([""]);
  const [status, setStatus] = useState("");
  const [facultyEmail, setFacultyEmail] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null); // Store the file URL for the PDF preview
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        const result = await getBySubmissionId(id);
        console.log(result.courseName);

        setFacultyEmail(result?.teacherName || "");
        setSubjectName(result?.courseName || "");
        setSubjectCode(result?.subjectCode || "");
        setDepartment(result?.dept || "");
        setSemester(result?.semester || "");
        setYear(result?.year || "");
        setDescription(result?.description || "");
        setStatus(result?.status || "");
        setFeedbackMessages(result?.feedback);
      } catch (error) {
        console.error("Error fetching submission data:", error);
      }
    };
    fetchSubmissionData();
  }, [id]);

  const handleApprove = async () => {
    try {
      await approveSubmission(id);
      navigate("/scrutiny");
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async () => {
    try {
      await provideFeedback(id, feedbackMessages);
      navigate("/scrutiny");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <form>
        {/* Header Section */}
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/6d53af9af6a4e53d74d06edc1f3049266467905105dc543ead92f679583e8d6c?placeholderIfAbsent=true&apiKey=2fc17400dcd74914b50bcc9d036de5cf"
          className={styles.headerIcon}
          alt="Note Editor Icon"
        />
        <div className={styles.contentWrapper}>
          <h1 className={styles.userName}>
            Welcome, {extractName(auth.currentUser.email)}
          </h1>
          <div className={styles.mainContent}>
            <div className={styles.contentGrid}>
              {/* Preview Section */}
              <div className={styles.previewColumn}>
                <div className={styles.previewSection}>
                  <h2 className={styles.previewTitle}>Preview</h2>
                  <div className={styles.previewBox}>
                    {fileURL ? (
                      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                        <Viewer fileUrl={fileURL} />
                      </Worker>
                    ) : (
                      <p>No file selected</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Details Section */}
              <div className={styles.detailsColumn}>
                <div className={styles.detailsSection}>
                  <h2 className={styles.detailsTitle}>Details</h2>
                  <div className={styles.subjectContainer}>
                    <label className={styles.subjectTitle}>Faculty Name:</label>
                    <input
                      type="text"
                      value={facultyEmail}
                      className={styles.subjectInput}
                      readOnly
                    />
                  </div>
                  <div className={styles.subjectContainer}>
                    <label className={styles.subjectTitle}>Department:</label>
                    <input
                      type="text"
                      value={department}
                      className={styles.subjectInput}
                      readOnly
                    />
                  </div>
                  <div className={styles.subjectContainer}>
                    <label className={styles.subjectTitle}>Semester:</label>
                    <input
                      type="text"
                      value={semester}
                      className={styles.subjectInput}
                      readOnly
                    />
                  </div>
                  <div className={styles.subjectContainer}>
                    <label className={styles.subjectTitle}>Year:</label>
                    <input
                      type="text"
                      value={year}
                      className={styles.subjectInput}
                      readOnly
                    />
                  </div>
                  <div className={styles.subjectContainer}>
                    <label className={styles.subjectTitle}>
                      Subject Title:
                    </label>
                    <input
                      type="text"
                      value={subjectName}
                      className={styles.subjectInput}
                      readOnly
                    />
                  </div>
                  <div className={styles.subjectContainer}>
                    <label className={styles.subjectTitle}>Subject Code:</label>
                    <input
                      type="text"
                      value={subjectCode}
                      className={styles.subjectInput}
                      readOnly
                    />
                  </div>
                </div>
                <div className={styles.feedbackSection}>
                  <h2 className={styles.feedbackTitle}>Feedback</h2>
                  {feedbackMessages && feedbackMessages.length > 0 ? (
                    feedbackMessages.map((message, index) => (
                      <FeedbackMessage key={index} message={message} />
                    ))
                  ) : (
                    <p>No feedback messages available.</p>
                  )}
                </div>
                {/* Feedback input button */}
                <div className={styles.subjectContainer}>
                  <label className={styles.subjectTitle}>Subject Title:</label>
                  <input
                    type="text"
                    value={""}
                    onChange={(e) => setFeedbackMessages(e.target.value)}
                    placeholder="provide feedback"
                    className={styles.subjectInput}
                  />
                </div>
                <div className={styles.divider}></div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.contentGrid}>
          <button
            type="button"
            className={styles.sendButton}
            onClick={handleApprove}
          >
            Approve
          </button>
          <button
            type="button"
            className={styles.sendButton}
            onClick={handleReject}
          >
            Rejected
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScrutinyApproval;
