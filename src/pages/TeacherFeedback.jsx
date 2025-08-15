import { useState, useEffect, useRef } from "react";
import styles from "./TeacherFeedback.module.css";
import { db, auth, storage } from "../firebase"; // Ensure storage is imported for re-uploads
import { doc, updateDoc } from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import {
  getBySubmissionId,
  departmentsList,
} from "../services/questionPaperService.js";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { v4 as uuidv4 } from "uuid";

// Helper to extract the user's first name from email
const extractName = (email) => {
  if (!email) return "User";
  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

// Reusable Dropdown Component
const DropdownField = ({
  title,
  options,
  selectedValue,
  onChange,
  disabled,
}) => (
  <div className={styles.dropdownContainer}>
    <label className={styles.formLabel}>{title}:</label>{" "}
    <select
      className={styles.formInput}
      value={selectedValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
    >
      {" "}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}{" "}
        </option>
      ))}{" "}
    </select>{" "}
  </div>
);

export const TeacherFeedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRefA = useRef(null);
  const fileInputRefB = useRef(null); // State Management

  const [status, setStatus] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [sharedDepartments, setSharedDepartments] = useState([]);
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [fileA, setFileA] = useState(null);
  const [fileURLA, setFileURLA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [fileURLB, setFileURLB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const isRejected = status === "Rejected";

  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        const result = await getBySubmissionId(id);
        if (!result) {
          toast.error("Submission not found.");
          navigate("/faculty");
          return;
        }

        setInitialData(result);
        setSubjectName(result.courseName || "");
        setSubjectCode(result.subjectCode || "");
        setStatus(result.status || "");
        setDepartment(result.dept || "");
        setYear(result.year || "");
        setSemester(result.semester || "");
        setSharedDepartments(result.shared || []);
        setFeedbackMessages(
          Array.isArray(result.feedback) ? result.feedback : []
        );

        if (result.fileURLA) setFileURLA(result.fileURLA);
        if (result.fileURLB) setFileURLB(result.fileURLB);
      } catch (error) {
        console.error("Error fetching submission data:", error);
        toast.error("Failed to load submission data.");
      }
    };
    fetchSubmissionData();
  }, [id, navigate]);

  const handleFileChange = (e, setFile, setURL) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setURL(URL.createObjectURL(selectedFile));
    } else if (selectedFile) {
      toast.error("Please select a valid PDF file.");
    }
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setSharedDepartments((prev) =>
      checked ? [...prev, value] : prev.filter((dept) => dept !== value)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRejected && (!fileA || !fileB)) {
      toast.error(
        "For rejected items, please upload new files for both Set A and Set B to resubmit."
      );
      return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, "uploads", id);
      const updateData = {
        subjectCode,
        courseName: subjectName,
        dept: department,
        year,
        semester,
        shared: sharedDepartments,
        status: "Pending",
        uploadedAt: new Date(),
      };

      if (isRejected) {
        // Re-upload files only if the status was rejected
        const fileId = uuidv4();

        // Upload Set A
        const fileExtensionA = fileA.name.split(".").pop();
        const fileNameA = `${fileId}-A.${fileExtensionA}`;
        const storageRefA = storageRef(storage, `uploads/${fileNameA}`);
        await uploadBytes(storageRefA, fileA);
        updateData.fileURLA = await getDownloadURL(storageRefA);
        updateData.fileNameA = fileNameA;

        // Upload Set B
        const fileExtensionB = fileB.name.split(".").pop();
        const fileNameB = `${fileId}-B.${fileExtensionB}`;
        const storageRefB = storageRef(storage, `uploads/${fileNameB}`);
        await uploadBytes(storageRefB, fileB);
        updateData.fileURLB = await getDownloadURL(storageRefB);
        updateData.fileNameB = fileNameB;
      }

      await updateDoc(docRef, updateData);
      toast.success("Submission updated successfully!");
      navigate("/faculty");
    } catch (error) {
      console.error("Error updating submission:", error);
      toast.error("Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Open print dialogs for each file
    if (fileURLA) window.open(fileURLA, "_blank")?.print();
    if (fileURLB) window.open(fileURLB, "_blank")?.print();
    if (!fileURLA && !fileURLB) toast.error("No files available to print.");
  };

  return (
    <div className={styles.pageContainer}>
      {" "}
      <div className={styles.header}>
        <h1 className={styles.title}>Submission Details</h1>{" "}
        <h2 className={styles.userName}>
          Welcome, {extractName(auth.currentUser?.email)}
        </h2>{" "}
      </div>{" "}
      <form className={styles.contentGrid} onSubmit={handleSubmit}>
        {" "}
        <div className={styles.previewColumn}>
          {" "}
          <div className={styles.pdfViewerContainer}>
            {" "}
            <div className={styles.pdfViewer}>
              <h4>Set A</h4>{" "}
              <div className={styles.previewBox}>
                {" "}
                {fileURLA ? (
                  <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                    <Viewer fileUrl={fileURLA} />{" "}
                  </Worker>
                ) : (
                  <p className={styles.noFileText}>No file for Set A</p>
                )}{" "}
              </div>{" "}
              {isRejected && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => fileInputRefA.current?.click()}
                >
                  Upload New Set A
                </button>
              )}{" "}
              <input
                type="file"
                ref={fileInputRefA}
                onChange={(e) => handleFileChange(e, setFileA, setFileURLA)}
                style={{ display: "none" }}
                accept="application/pdf"
              />{" "}
            </div>{" "}
            <div className={styles.pdfViewer}>
              <h4>Set B</h4>{" "}
              <div className={styles.previewBox}>
                {" "}
                {fileURLB ? (
                  <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                    <Viewer fileUrl={fileURLB} />{" "}
                  </Worker>
                ) : (
                  <p className={styles.noFileText}>No file for Set B</p>
                )}{" "}
              </div>{" "}
              {isRejected && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => fileInputRefB.current?.click()}
                >
                  Upload New Set B
                </button>
              )}{" "}
              <input
                type="file"
                ref={fileInputRefB}
                onChange={(e) => handleFileChange(e, setFileB, setFileURLB)}
                style={{ display: "none" }}
                accept="application/pdf"
              />{" "}
            </div>{" "}
          </div>{" "}
          <div className={styles.buttonGroup}>
            {" "}
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handlePrint}
              disabled={!fileURLA && !fileURLB}
            >
              Print Files
            </button>{" "}
          </div>{" "}
        </div>{" "}
        <div className={styles.detailsColumn}>
          {" "}
          {feedbackMessages.length > 0 && (
            <div className={styles.card}>
              {" "}
              <h3 className={styles.columnTitle}>Reviewer Feedback</h3>{" "}
              <div className={styles.feedbackContainer}>
                {" "}
                {feedbackMessages.map((message, index) => (
                  <FeedbackMessage key={index} message={message} />
                ))}{" "}
              </div>{" "}
            </div>
          )}{" "}
          <div className={styles.card}>
            <h3 className={styles.columnTitle}>Details</h3>{" "}
            <div className={styles.formGrid}>
              {" "}
              <div className={styles.formGroup}>
                <label htmlFor="subjectName" className={styles.formLabel}>
                  Subject Title:
                </label>
                <input
                  id="subjectName"
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className={styles.formInput}
                  readOnly={!isRejected}
                  required
                />
              </div>{" "}
              <div className={styles.formGroup}>
                <label htmlFor="subjectCode" className={styles.formLabel}>
                  Subject Code:
                </label>
                <input
                  id="subjectCode"
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className={styles.formInput}
                  readOnly={!isRejected}
                  required
                />
              </div>{" "}
              <DropdownField
                title="Department"
                options={departmentsList.map((d) => ({ value: d, label: d }))}
                selectedValue={department}
                onChange={setDepartment}
                disabled={!isRejected}
              />{" "}
              <DropdownField
                title="Year"
                options={["1", "2", "3", "4"].map((y) => ({
                  value: y,
                  label: `Year ${y}`,
                }))}
                selectedValue={year}
                onChange={setYear}
                disabled={!isRejected}
              />{" "}
              <DropdownField
                title="Semester"
                options={["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => ({
                  value: s,
                  label: `Sem ${s}`,
                }))}
                selectedValue={semester}
                onChange={setSemester}
                disabled={!isRejected}
              />{" "}
            </div>{" "}
            <div className={styles.formGroupVertical}>
              {" "}
              <label className={styles.formLabel}>
                Share with other departments:
              </label>{" "}
              <div className={styles.checkboxGrid}>
                {" "}
                {departmentsList.map((dept) => (
                  <div key={dept} className={styles.checkboxItem}>
                    {" "}
                    <input
                      type="checkbox"
                      id={`dept-${dept}`}
                      value={dept}
                      checked={sharedDepartments.includes(dept)}
                      onChange={handleCheckboxChange}
                      disabled={!isRejected || dept === department}
                    />{" "}
                    <label htmlFor={`dept-${dept}`}>{dept}</label>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {isRejected && (
            <div className={styles.formActions}>
              {" "}
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={loading}
              >
                {" "}
                {loading ? "Resubmitting..." : "Resubmit for Approval"}{" "}
              </button>{" "}
            </div>
          )}{" "}
        </div>{" "}
      </form>{" "}
    </div>
  );
};

export default TeacherFeedback;
