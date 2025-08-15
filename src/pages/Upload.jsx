import { useState, useRef, useEffect } from "react";
import styles from "./Upload.module.css";
import { db, auth, storage } from "../firebase"; // Firebase configuration
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Worker, Viewer } from "@react-pdf-viewer/core"; // Import PDF Viewer
import "@react-pdf-viewer/core/lib/styles/index.css"; // Core styles
import "@react-pdf-viewer/default-layout/lib/styles/index.css"; // Default layout styles
import {
  departmentsList,
  getUserDepartment,
} from "../services/questionPaperService";
import { v4 as uuidv4 } from "uuid";

// (No changes to extractName and DropdownField components)
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

// (No changes to dropdownData)
const dropdownData = [
  {
    title: "Share With",
    options: departmentsList.map((department) => ({ value: department })),
  },
  {
    title: "Year",
    options: [{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }],
  },
  {
    title: "Semester",
    options: [
      { value: "1" }, { value: "2" }, { value: "3" }, { value: "4" },
      { value: "5" }, { value: "6" }, { value: "7" }, { value: "8" },
    ],
  },
];

// NEW: Reusable component for file upload sections to keep code DRY
const FileUploadSection = ({ title, fileURL, onUploadClick, onFileChange, inputRef }) => {
  return (
    <div className={styles.previewSection}>
      <h2 className={styles.previewTitle}>{title}</h2>
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
        ref={inputRef}
        onChange={onFileChange}
        style={{ display: "none" }}
        accept="application/pdf"
      />
      <button
        type="button"
        className={styles.uploadButton}
        onClick={onUploadClick}
      >
        Upload File
      </button>
    </div>
  );
};

export const NoteEditor = () => {
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [sharedDepartment, setSharedDepartment] = useState([]);
  const [dropdownValues, setDropdownValues] = useState({
    Department: "AD",
    Year: "2",
    Semester: "4",
  });

  // MODIFIED: State for two files (Set A and Set B)
  const [fileA, setFileA] = useState(null);
  const [fileURLA, setFileURLA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [fileURLB, setFileURLB] = useState(null);
  
  const [loading, setLoading] = useState(false);

  // MODIFIED: Refs for two file inputs
  const fileInputRefA = useRef(null);
  const fileInputRefB = useRef(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDepartment = async () => {
      try {
        const userDept = await getUserDepartment(auth.currentUser.email);
        setDepartment(userDept);
      } catch (error) {
        console.error("Error fetching department:", error);
        toast.error("Error fetching department.");
      }
    };
    fetchUserDepartment();
  }, []);
  
  // (No changes to handleDropdownChange)
  const handleDropdownChange = (title, value) => {
    setDropdownValues((prev) => ({ ...prev, [title]: value }));
    if (title !== "Share With" || value === department) {
      return;
    }
    setSharedDepartment((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  // MODIFIED: Handles file changes for either Set A or Set B
  const handleFileChange = (e, fileSet) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      const fileUrl = URL.createObjectURL(selectedFile);
      if (fileSet === 'A') {
        setFileA(selectedFile);
        setFileURLA(fileUrl);
      } else { // fileSet === 'B'
        setFileB(selectedFile);
        setFileURLB(fileUrl);
      }
    } else {
        toast.error("Please select a valid PDF file.");
    }
  };
  
  // MODIFIED: Triggers the correct file input click
  const handleFileUpload = (fileSet) => {
    if (fileSet === 'A') {
      fileInputRefA.current.click();
    } else { // fileSet === 'B'
      fileInputRefB.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // MODIFIED: Validate both files are selected
    if (!subjectName || !subjectCode || !fileA || !fileB) {
      toast.error("Please fill out all required fields and upload both Set A and Set B files.");
      return;
    }

    setLoading(true);
    try {
      const fileId = uuidv4(); // Generate a single unique ID for the pair

      // --- Upload File A ---
      const fileExtensionA = fileA.name.split(".").pop();
      const fileNameA = `${fileId}-A.${fileExtensionA}`;
      const storageRefA = ref(storage, `uploads/${fileNameA}`);
      await uploadBytes(storageRefA, fileA);
      const downloadURLA = await getDownloadURL(storageRefA);

      // --- Upload File B ---
      const fileExtensionB = fileB.name.split(".").pop();
      const fileNameB = `${fileId}-B.${fileExtensionB}`;
      const storageRefB = ref(storage, `uploads/${fileNameB}`);
      await uploadBytes(storageRefB, fileB);
      const downloadURLB = await getDownloadURL(storageRefB);

      // MODIFIED: Add both file details to the Firestore document
      const docRef = await addDoc(collection(db, "uploads"), {
        subjectCode,
        courseName: subjectName,
        description,
        teacherName: extractName(auth.currentUser.email),
        uploadedBy: auth.currentUser.email,
        status: "Pending",
        dept: department,
        shared: sharedDepartment,
        year: dropdownValues.Year,
        semester: dropdownValues.Semester,
        uploadedAt: new Date(),
        // Fields for Set A
        fileNameA, 
        fileURLA: downloadURLA,
        // Fields for Set B
        fileNameB,
        fileURLB: downloadURLB,
      });

      toast.success("Files uploaded successfully!");
      console.log("Document written with ID: ", docRef.id);
      
      // MODIFIED: Reset all states including both files
      setSubjectCode("");
      setSubjectName("");
      setDescription("");
      setDropdownValues({ Department: "AD", Year: "2", Semester: "4" });
      setFileA(null);
      setFileURLA(null);
      setFileB(null);
      setFileURLB(null);

      navigate("/faculty");

    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <form onSubmit={handleSubmit}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.userName}>
            Welcome, {extractName(auth.currentUser.email)}
          </h1>
          <div className={styles.mainContent}>
            <div className={styles.contentGrid}>
              
              {/* MODIFIED: The left column now contains two upload sections */}
              <div className={styles.previewColumn}>
                <FileUploadSection
                  title="Set A"
                  fileURL={fileURLA}
                  onUploadClick={() => handleFileUpload('A')}
                  onFileChange={(e) => handleFileChange(e, 'A')}
                  inputRef={fileInputRefA}
                />
                <FileUploadSection
                  title="Set B"
                  fileURL={fileURLB}
                  onUploadClick={() => handleFileUpload('B')}
                  onFileChange={(e) => handleFileChange(e, 'B')}
                  inputRef={fileInputRefB}
                />
              </div>

              {/* The details column remains the same */}
              <div className={styles.detailsColumn}>
                <div className={styles.detailsSection}>
                  <h2 className={styles.detailsTitle}>Details</h2>
                  
                  {/* Field Groups for Subject Title, Code, Department */}
                  <div className={styles.formGroup}>
                    <label htmlFor="subjectName" className={styles.formLabel}>Subject Title:</label>
                    <input id="subjectName" type="text" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className={styles.formInput} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="subjectCode" className={styles.formLabel}>Subject Code:</label>
                    <input id="subjectCode" type="text" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} className={styles.formInput} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="department" className={styles.formLabel}>Department:</label>
                    <input id="department" type="text" value={department} className={styles.formInput} required readOnly />
                  </div>
                  
                  {/* Dropdown Row */}
                  <div className={styles.dropdownRow}>
                    {dropdownData.map((dropdown, index) => (
                      <DropdownField
                        key={index}
                        title={dropdown.title}
                        options={dropdown.options}
                        selectedValue={dropdownValues[dropdown.title]}
                        onChange={(value) => handleDropdownChange(dropdown.title, value)}
                      />
                    ))}
                  </div>

                  {/* Shared Departments Section */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Share With:</label>
                    <div className={styles.sharedDepartmentsContainer}>
                      {sharedDepartment.length > 0 ? (
                        sharedDepartment.map((dept, index) => (
                          <div key={index} className={styles.sharedDepartmentTag}>
                            {dept}
                            <button type="button" className={styles.removeButton} onClick={() => setSharedDepartment((prev) => prev.filter((item) => item !== dept))}>
                              &times;
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className={styles.noSelectionText}>No other departments selected</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Form Actions */}
                  <div className={styles.formActions}>
                    <button type="submit" disabled={loading} className={styles.sendButton}>
                      {loading ? "Uploading..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NoteEditor;