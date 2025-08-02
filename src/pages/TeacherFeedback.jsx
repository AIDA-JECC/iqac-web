import { useState, useEffect, useRef } from "react";
import styles from "./TeacherFeedback.module.css";
import { db, auth } from "../firebase"; // Firebase configuration
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { getBySubmissionId } from "../services/questionPaperService.js";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { departmentsList } from "../services/questionPaperService";

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
    <label className={styles.formLabel}>{title}:</label>
    <select
      className={styles.formInput} // Using unified formInput style
      value={selectedValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export const TeacherFeedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State Management
  const [status, setStatus] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("AD");
  const [year, setYear] = useState("2");
  const [semester, setSemester] = useState("4");
  const [sharedDepartments, setSharedDepartments] = useState([]); // State for checkboxes
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null);

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

        // Set state from fetched data
        setSubjectName(result.courseName || "");
        setSubjectCode(result.subjectCode || "");
        setDescription(result.description || "");
        setStatus(result.status || "");
        setDepartment(result.dept || "AD");
        setYear(result.year || "2");
        setSemester(result.semester || "4");
        setSharedDepartments(result.sharedDepartments || []);
        setFeedbackMessages(
          Array.isArray(result.feedback) ? result.feedback : []
        );

        // Fetch PDF file for viewing
        if (result.fileURL) {
          const storage = getStorage();
          const fileRef = ref(storage, result.fileURL);
          const url = await getDownloadURL(fileRef);
          setFileURL(url);
        }
      } catch (error) {
        console.error("Error fetching submission data:", error);
        toast.error("Failed to load submission data.");
      }
    };
    fetchSubmissionData();
  }, [id, navigate]);

  // Handler for file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setFileURL(URL.createObjectURL(selectedFile));
    } else if (selectedFile) {
      toast.error("Please select a valid PDF file.");
    }
  };

  // Handler for shared department checkbox changes
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setSharedDepartments((prev) =>
      checked ? [...prev, value] : prev.filter((dept) => dept !== value)
    );
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRejected && !file) {
      toast.error("Please upload a new file to resubmit.");
      return;
    }

    try {
      const docRef = doc(db, "uploads", id);
      await updateDoc(docRef, {
        subjectCode,
        courseName: subjectName,
        description,
        dept: department,
        year,
        semester,
        sharedDepartments, // Save shared departments
        status: "Pending", // Reset status to Pending on resubmission
        uploadedAt: new Date(),
        // Note: You would handle file re-upload logic here,
        // which typically involves uploading to Storage and then updating the URL in Firestore.
        // This example focuses on updating the document fields.
      });

      toast.success("Submission updated successfully!");
      navigate("/faculty");
    } catch (error) {
      console.error("Error updating submission:", error);
      toast.error("Update failed. Please try again.");
    }
  };

  const handlePrint = () => {
    if (fileURL) {
      const printWindow = window.open(fileURL, "_blank");
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
    } else {
      toast.error("No file available to print.");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Submission Details</h1>
        <h2 className={styles.userName}>
          Welcome, {extractName(auth.currentUser?.email)}
        </h2>
      </div>

      <form className={styles.contentGrid} onSubmit={handleSubmit}>
        {/* Left Column: PDF Preview & Actions */}
        <div className={styles.previewColumn}>
          <h3 className={styles.columnTitle}>Document Preview</h3>
          <div className={styles.previewBox}>
            {fileURL ? (
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <div className={styles.pdfContainer}>
                  <Viewer fileUrl={fileURL} />
                </div>
              </Worker>
            ) : (
              <p className={styles.noFileText}>No file available for preview</p>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept="application/pdf"
          />
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handlePrint}
              disabled={!fileURL}
            >
              Print
            </button>
            {isRejected && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => fileInputRef.current.click()}
              >
                Upload New File
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Details, Feedback & Submission */}
        <div className={styles.detailsColumn}>
          {/* --- Feedback Section --- */}
          {feedbackMessages.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.columnTitle}>Reviewer Feedback</h3>
              <div className={styles.feedbackContainer}>
                {feedbackMessages.map((message, index) => (
                  <FeedbackMessage key={index} message={message} />
                ))}
              </div>
            </div>
          )}

          {/* --- Details Section --- */}
          <div className={styles.card}>
            <h3 className={styles.columnTitle}>Details</h3>
            <div className={styles.formGrid}>
              {/* Subject Title */}
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
              </div>

              {/* Subject Code */}
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
              </div>

              {/* Department, Year, Semester Dropdowns */}
              <DropdownField
                title="Department"
                options={departmentsList.map((d) => ({ value: d, label: d }))}
                selectedValue={department}
                onChange={setDepartment}
                disabled={!isRejected}
              />
              <DropdownField
                title="Year"
                options={["1", "2", "3", "4"].map((y) => ({
                  value: y,
                  label: `Year ${y}`,
                }))}
                selectedValue={year}
                onChange={setYear}
                disabled={!isRejected}
              />
              <DropdownField
                title="Semester"
                options={["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => ({
                  value: s,
                  label: `Sem ${s}`,
                }))}
                selectedValue={setSemester}
                disabled={!isRejected}
              />
            </div>

            {/* --- Shared Departments Checkbox Section --- */}
            <div className={styles.formGroupVertical}>
              <label className={styles.formLabel}>
                Share with other departments:
              </label>
              <div className={styles.checkboxGrid}>
                {departmentsList.map((dept) => (
                  <div key={dept} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      id={`dept-${dept}`}
                      value={dept}
                      checked={sharedDepartments.includes(dept)}
                      onChange={handleCheckboxChange}
                      disabled={!isRejected || dept === department} // Disable if not rejected or if it's the primary dept
                    />
                    <label htmlFor={`dept-${dept}`}>{dept}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- Action Buttons --- */}
          {isRejected && (
            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton}>
                Resubmit for Approval
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default TeacherFeedback;
