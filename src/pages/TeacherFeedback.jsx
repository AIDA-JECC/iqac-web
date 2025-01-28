import { useState, useEffect, useRef } from "react";
import styles from "./Upload.module.css";
import { db, auth } from "../firebase"; // Firebase configuration
import { addDoc, collection,doc,updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Worker, Viewer } from "@react-pdf-viewer/core"; // Import PDF Viewer
import "@react-pdf-viewer/core/lib/styles/index.css"; // Core styles
import "@react-pdf-viewer/default-layout/lib/styles/index.css"; // Default layout styles
import { getBySubmissionId } from "../services/questionPaperService.js";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";

const extractName = (email) => {
  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

const DropdownField = ({ title, options, selectedValue, onChange }) => {
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

const dropdownData = [
  {
    title: "Department",
    options: [
      { value: "AD" },
      { value: "CS" },
      { value: "ME" },
      { value: "EC" },
      { value: "EEE" },
    ],
  },
  {
    title: "Year",
    options: [{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }],
  },
  {
    title: "Semester",
    options: [
      { value: "1" },
      { value: "2" },
      { value: "3" },
      { value: "4" },
      { value: "5" },
      { value: "6" },
      { value: "7" },
      { value: "8" },
    ],
  },
];

export const TeacherFeedback = () => {
  const { id } = useParams();
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [status, setStatus] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [dropdownValues, setDropdownValues] = useState({
    Department: "AD",
    Year: "2",
    Semester: "4",
  });
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null); // Store the file URL for the PDF preview
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        const result = await getBySubmissionId(id);
        console.log(result.courseName);

        setSubjectName(result?.courseName || "");
        setSubjectCode(result?.subjectCode || "");
        setDescription(result?.description || "");
        setStatus(result?.status || "");

        // Ensure dropdownValues are set correctly
        setDropdownValues({
          Department: result?.dept || "AD",
          Year: result?.year || "2",
          Semester: result?.semester || "4",
        });
      } catch (error) {
        console.error("Error fetching submission data:", error);
      }
    };
    fetchSubmissionData();
  }, [id]);

  const handleDropdownChange = (title, value) => {
    setDropdownValues((prev) => ({ ...prev, [title]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Generate a URL for the selected file
      if (selectedFile.type === "application/pdf") {
        const url = URL.createObjectURL(selectedFile);
        setFileURL(url);
      } else {
        setFileURL(null); // Reset the preview if the file is not a PDF
      }
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subjectName || !subjectCode || !file) {
      toast.error("Please fill out all required fields.");
      return;
    }

    try {
      // Reference the document to update using the ID from the URL params
      const docRef = doc(db, "uploads", id);

      // Update the document with new data
      await updateDoc(docRef, {
        subjectCode,
        courseName: subjectName,
        description,
       // teacherName: extractName(auth.currentUser.email),
        fileName: file.name,
        uploadedBy: auth.currentUser.email,
        status: "Pending",
        dept: dropdownValues.Department,
        year: dropdownValues.Year,
        semester: dropdownValues.Semester,
        uploadedAt: new Date(),
      });

      toast.success("File updated successfully!");
      console.log("Document updated with ID: ", id);

      // Reset form fields
      setSubjectCode("");
      setSubjectName("");
      setDescription("");
      setDropdownValues({ Department: "AD", Year: "2", Semester: "4" });
      setFile(null);
      setFileURL(null);

      // Navigate back to the faculty page or desired route
      navigate("/faculty");
    } catch (error) {
      console.error("Error updating file:", error);
      toast.error("Update failed. Please check your permissions.");
    }
  };

  return (
    <div className={styles.editorContainer}>
      <form onSubmit={handleSubmit}>
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
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    accept="application/pdf"
                  />
                  {status === "Rejected" && (
                    <button
                      type="button"
                      className={styles.uploadButton}
                      onClick={handleFileUpload}
                    >
                      Upload File
                    </button>
                  )}
                </div>
              </div>
              {/* Details Section */}

              <div className={styles.detailsColumn}>
                <div className={styles.feedbackSection}>
                  <h2 className={styles.feedbackTitle}>Feedback</h2>
                  {feedbackMessages.map((message, index) => (
                    <FeedbackMessage key={index} message={message} />
                  ))}
                </div>
                <div className={styles.detailsSection}>
                  <h2 className={styles.detailsTitle}>Details</h2>
                  <div className={styles.subjectContainer}>
                    <label
                      htmlFor="subjectName"
                      className={styles.subjectTitle}
                    >
                      Subject Title:
                    </label>
                    <input
                      id="subjectName"
                      type="text"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className={styles.subjectInput}
                      required
                    />
                  </div>
                  <div className={styles.divider}></div>
                  <div className={styles.subjectContainer}>
                    <label
                      htmlFor="subjectCode"
                      className={styles.subjectTitle}
                    >
                      Subject Code:
                    </label>
                    <input
                      id="subjectCode"
                      type="text"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      className={styles.subjectInput}
                      required
                    />
                  </div>
                  <div className={styles.divider}></div>
                  <div className={styles.dropdownRow}>
                    {/* Dropdowns */}
                    {dropdownData.map((dropdown, index) => (
                      <DropdownField
                        key={index}
                        title={dropdown.title}
                        options={dropdown.options}
                        selectedValue={dropdownValues[dropdown.title]}
                        onChange={(value) =>
                          handleDropdownChange(dropdown.title, value)
                        }
                      />
                    ))}
                  </div>
                  {status === "Rejected" && (
                    <button type="submit" className={styles.sendButton}>
                      Send
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TeacherFeedback;

{
  /* <div className={styles.feedbackSection}>
  <h2 className={styles.feedbackTitle}>Feedback</h2>
  {feedbackMessages.map((message, index) => (
    <FeedbackMessage key={index} message={message} />
  ))}
</div>; */
}
