import { useState, useEffect } from "react";
import styles from "./ScrutinyApproval.module.css";
import { auth } from "../firebase"; // Firebase configuration
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import {
  getBySubmissionId,
  approveSubmission,
  provideFeedback,
} from "../services/questionPaperService.js";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";

// Import pdf-lib and the PDF template
// Add PDFName and PDFNumber to your import line
import { PDFDocument, StandardFonts, PDFName, PDFNumber } from "pdf-lib";
import formUrl from "./QP_Scrutiny Form_New _Fields.pdf";

const extractName = (email) => {
  if (!email) return "Scrutinizer";
  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

const scrutinyChecklistItems = [
  "Name of examination, semester, month, and year are specified correctly.",
  "QP Code, Subject Code, and Subject Name are correctly mentioned.",
  "Maximum marks and duration of examination are specified correctly.",
  "Instructions to candidates are clearly written.",
  "Relevant CO(s) statements with its BTL are clearly stated.",
  "Each question is mapped with corresponding Course Outcomes (COs).",
  "Each question is categorized into the appropriate Bloom’s Taxonomy Level (BTL).",
  "Units/modules are proportionally represented.",
  "Questions are clearly worded and unambiguous.",
  "No grammatical, spelling, or formatting errors.",
  "No duplication of questions within the paper.",
  "Tables, figures, and equations are clearly mentioned and properly labeled.",
  "Mark distribution per question is appropriate and clearly mentioned.",
  "Question paper follows the pattern specified in the course syllabus.",
  "Choice of questions is appropriately provided (if applicable).",
];

export const ScrutinyApproval = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- Component State ---
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [facultyEmail, setFacultyEmail] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [fileURL, setFileURL] = useState(null);

  const [checkedState, setCheckedState] = useState(
    scrutinyChecklistItems.map(() => ({ status: null }))
  );

  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        const result = await getBySubmissionId(id);
        if (result) {
          setFacultyEmail(result.teacherName || "");
          setSubjectName(result.courseName || "");
          setSubjectCode(result.subjectCode || "");
          setDepartment(result.dept || "");
          setSemester(result.semester || "");
          setYear(result.year || "");
          setFileURL(result.fileURL || null);
          setFeedbackMessages(
            Array.isArray(result.feedback) ? result.feedback : []
          );

          if (result.scrutinyReport && Array.isArray(result.scrutinyReport)) {
            const initialCheckedState = scrutinyChecklistItems.map(
              (itemText) => {
                const savedItem = result.scrutinyReport.find(
                  (reportItem) => reportItem.requirement === itemText
                );
                return {
                  status:
                    savedItem && savedItem.status === "Yes" ? "Yes" : null,
                };
              }
            );
            setCheckedState(initialCheckedState);
          }
        }
      } catch (error) {
        console.error("Error fetching submission data:", error);
        toast.error("Failed to fetch submission data.");
      }
    };
    fetchSubmissionData();
  }, [id]);

  const handleCheckboxChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) => {
      if (index === position) {
        const newStatus = item.status === "Yes" ? null : "Yes";
        return { ...item, status: newStatus };
      }
      return item;
    });
    setCheckedState(updatedCheckedState);
  };

  const handleGenerateReport = async () => {
    try {
      // 1. Fetch and load the PDF template
      const formPdfBytes = await fetch(formUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(formPdfBytes);
      const form = pdfDoc.getForm();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontOptions = { font: timesRomanFont };

      // 2. Fill top-level text fields
      form
        .getField("Course Code & Title")
        .setText(`${subjectCode} - ${subjectName}`, fontOptions);
      form.getField("Name of the QP Setter").setText(facultyEmail, fontOptions);
      form
        .getField("Semester & Branch")
        .setText(`${semester} / ${department}`, fontOptions);
      form
        .getField("Date of Scrutiny")
        .setText(new Date().toLocaleDateString("en-IN"), fontOptions);
      form
        .getField("Name of the QP Scrutinizer")
        .setText(extractName(auth.currentUser?.email), fontOptions);

      // 3. Fill the checklist
      checkedState.forEach((item, index) => {
        const serial = index + 1;
        if (item.status === "Yes") {
          form.getField(`SL-${serial}A-YES`).check();
        } else {
          form.getField(`SL-${serial}A-NO`).check();
        }
      });

      // 4. Determine final recommendation for SET A
      const allItemsApproved = checkedState.every(
        (item) => item.status === "Yes"
      );
      if (allItemsApproved) {
        form
          .getField("SETA: Approved without Correction")
          .setText("Yes", fontOptions);
        form.getField("SETA: Resubmission Required").setText("No", fontOptions);
      } else {
        form
          .getField("SETA: Approved without Correction")
          .setText("No", fontOptions);
        form
          .getField("SETA: Resubmission Required")
          .setText("Yes", fontOptions);
      }

      // 5. ✅ Manually set the "read-only" flag for every field
      const fields = form.getFields();
      fields.forEach((field) => {
        // Get the underlying dictionary for the field
        const fieldDict = field.acroField.dict;

        // Get the current flags, default to 0 if not present
        let flags = 0;
        const ff = fieldDict.get(PDFName.of("Ff"));
        if (ff instanceof PDFNumber) {
          flags = ff.asNumber();
        }

        // Set the 1st bit (ReadOnly) using a bitwise OR
        fieldDict.set(PDFName.of("Ff"), PDFNumber.of(flags | 1));
      });

      // 6. Save the PDF. The fields will be visible but locked.
      const filledPdfBytes = await pdfDoc.save();
      const blob = new Blob([filledPdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Scrutiny-Form-Final-${subjectCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Scrutiny form filled and downloaded!");
    } catch (error) {
      console.error("Failed to generate and fill PDF:", error);
      toast.error("Could not generate report. Check console for details.");
    }
  };

  const handleApprove = async () => {
    const scrutinyReport = scrutinyChecklistItems.map((item, index) => ({
      requirement: item,
      status: checkedState[index].status === "Yes" ? "Yes" : "No",
    }));
    try {
      await approveSubmission(id, scrutinyReport);
      toast.success("Submission approved successfully!");
      navigate("/scrutiny");
    } catch (error) {
      toast.error("Failed to approve submission.");
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (newFeedback.trim() === "") {
      toast.error("Please provide feedback before rejecting.");
      return;
    }
    const scrutinyReport = scrutinyChecklistItems.map((item, index) => ({
      requirement: item,
      status: checkedState[index].status === "Yes" ? "Yes" : "No",
    }));
    try {
      await provideFeedback(id, newFeedback, scrutinyReport);
      toast.info("Submission rejected with feedback.");
      navigate("/scrutiny");
    } catch (error) {
      toast.error("Failed to reject submission.");
      console.error(error);
    }
  };

  const handlePrint = () => {
    if (fileURL) {
      const printWindow = window.open(fileURL, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } else {
      toast.error("No file available to print.");
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.pageTitle}>Scrutiny & Approval</h1>
        <div className={styles.mainContent}>
          <div className={styles.contentGrid}>
            <div className={styles.previewColumn}>
              <div className={styles.previewCard}>
                <h2 className={styles.cardTitle}>Document Preview</h2>
                <div className={styles.previewBox}>
                  {fileURL ? (
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                      <Viewer fileUrl={fileURL} />
                    </Worker>
                  ) : (
                    <p>Loading document...</p>
                  )}
                </div>
                {fileURL && (
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.printButton}`}
                    onClick={handlePrint}
                  >
                    Print Original Document
                  </button>
                )}
              </div>
            </div>

            <div className={styles.detailsColumn}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Submission Details</h2>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Faculty Name:</label>
                  <input
                    type="text"
                    value={facultyEmail}
                    className={styles.formInput}
                    readOnly
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject:</label>
                  <input
                    type="text"
                    value={subjectName}
                    className={styles.formInput}
                    readOnly
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject Code:</label>
                  <input
                    type="text"
                    value={subjectCode}
                    className={styles.formInput}
                    readOnly
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Department:</label>
                  <input
                    type="text"
                    value={department}
                    className={styles.formInput}
                    readOnly
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Year / Sem:</label>
                  <input
                    type="text"
                    value={`${year} / ${semester}`}
                    className={styles.formInput}
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Verification Checklist</h2>
                <div className={styles.checklistContainer}>
                  {checkedState.map((item, index) => (
                    <label
                      className={styles.checklistItem}
                      key={index}
                      htmlFor={`checkbox-${index}`}
                    >
                      <input
                        type="checkbox"
                        id={`checkbox-${index}`}
                        checked={item.status === "Yes"}
                        onChange={() => handleCheckboxChange(index)}
                        className={styles.checklistCheckbox}
                      />
                      <span className={styles.checklistText}>
                        {scrutinyChecklistItems[index]}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.generateReportButton}`}
                  onClick={handleGenerateReport}
                >
                  Generate & Download Scrutiny Report
                </button>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Feedback History</h2>
                <div className={styles.feedbackList}>
                  {feedbackMessages.length > 0 ? (
                    feedbackMessages.map((msg, index) => (
                      <FeedbackMessage key={index} message={msg} />
                    ))
                  ) : (
                    <p className={styles.noFeedbackText}>
                      No previous feedback messages.
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  Provide New Feedback (if rejecting)
                </h2>
                <textarea
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder="Enter feedback here before rejecting..."
                  className={styles.formInput}
                  rows={4}
                />
              </div>

              <div className={styles.finalActions}>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.rejectButton}`}
                  onClick={handleReject}
                >
                  Reject with Feedback
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.approveButton}`}
                  onClick={handleApprove}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrutinyApproval;
