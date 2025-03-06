import { useState, useRef, useEffect } from "react";
import styles from "./Upload.module.css";
import { db, auth, storage } from "../firebase"; // Firebase configuration
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import ref, uploadBytes, and getDownloadURL
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
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  // const sharedDepartment = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserDepartment = async () => {
      try {
        const userDept = await getUserDepartment(auth.currentUser.email);
        setDepartment(userDept); // Set the department to state
      } catch (error) {
        console.error("Error fetching department:", error);
        toast.error("Error fetching department.");
      }
    };

    fetchUserDepartment();
  }, []);

  const handleDropdownChange = (title, value) => {
    setDropdownValues((prev) => ({ ...prev, [title]: value }));

    console.log(title,value)
    if (title !== "Share With" || value === department) {
      return
    }

    setSharedDepartment((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type === "application/pdf") {
        setFileURL(URL.createObjectURL(selectedFile));
      } else {
        setFileURL(null);
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

    setLoading(true);
    try {
      const fileId = uuidv4(); // Generate unique file ID
      const fileExtension = file.name.split(".").pop(); // Get file extension
      const fileName = `${fileId}.${fileExtension}`; // Generate new filename

      const storageRef = ref(storage, `uploads/${fileName}`);
      await uploadBytes(storageRef, file);
      const fileURL = await getDownloadURL(storageRef);

      const docRef = await addDoc(collection(db, "uploads"), {
        subjectCode,
        courseName: subjectName,
        description,
        teacherName: extractName(auth.currentUser.email),
        fileName, // Store new file name
        uploadedBy: auth.currentUser.email,
        status: "Pending",
        dept: department,
        shared: sharedDepartment,
        year: dropdownValues.Year,
        semester: dropdownValues.Semester,
        uploadedAt: new Date(),
        fileURL,
      });

      toast.success("File uploaded successfully!");
      console.log("Document written with ID: ", docRef.id);

      setSubjectCode("");
      setSubjectName("");
      setDescription("");
      setDropdownValues({ Department: "AD", Year: "2", Semester: "4" });
      setFile(null);
      setFileURL(null);

      navigate("/faculty");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Upload failed. Please check your permissions.");
    } finally {
      setLoading(false);
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
                        {/* <div className={styles.pdfContainer}> */}
                        <Viewer fileUrl={fileURL} />
                        {/* </div> */}
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
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={handleFileUpload}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {/* Details Section */}
              <div className={styles.detailsColumn}>
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
                  <div className={styles.subjectContainer}>
                    <label htmlFor="department" className={styles.subjectTitle}>
                      Department:
                    </label>
                    <input
                      id="department"
                      type="text"
                      value={department}
                      // onChange={(e) => setSubjectCode(e.target.value)}
                      className={styles.subjectInput}
                      required
                      readOnly
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
                
                  <div className={styles.sharedDepartmentsContainer}>
                  <div className={styles.subjectInput}>Share With:</div>
                    {sharedDepartment.map((dept, index) => (
                      <div key={index} className={styles.sharedDepartmentTag}>
                        {dept}
                        <button
                          className={styles.removeButton}
                          onClick={() =>
                            setSharedDepartment((prev) =>
                              prev.filter((item) => item !== dept)
                            )
                          }
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* <div>
                    <label htmlFor="description">Description:</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={styles.descriptionBox}
                      rows={4}
                    />
                  </div> */}
                  {/* <button type="submit" className={styles.sendButton}>
                    Send
                  </button> */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.sendButton}
                  >
                    {loading ? "Uploading..." : "Send"}
                  </button>
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
