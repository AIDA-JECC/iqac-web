import { useState, useEffect } from "react";
import styles from "./ScrutinyApproval.module.css";
import { auth } from "../firebase"; // Firebase configuration
import { useSendRejectionEmail } from "../services/emailService";
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
import { PDFDocument, StandardFonts, PDFTextField, rgb } from "pdf-lib";
import formUrl from "./modified_scrutiny.pdf";

// --- Helper Functions & Constants ---
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

// --- Reusable Checklist Component ---
const ScrutinyChecklist = ({ title, items, checkedState, onStateChange }) => (
  <div className={styles.card}>
        <h2 className={styles.cardTitle}>{title}</h2>   {" "}
    <div className={styles.checklistContainer}>
           {" "}
      {items.map((itemText, index) => (
        <div className={styles.checklistItem} key={index}>
                   {" "}
          <span className={styles.checklistText}>
                        {index + 1}. {itemText}         {" "}
          </span>
                   {" "}
          <div className={styles.radioGroup}>
                       {" "}
            {["Yes", "No", "N/A"].map((option) => (
              <label key={option} className={styles.radioLabel}>
                               {" "}
                <input
                  type="radio"
                  name={`checklist-${title}-${index}`}
                  value={option}
                  checked={checkedState[index].status === option}
                  onChange={() => onStateChange(index, option)}
                  className={styles.checklistRadio}
                />
                                {option}             {" "}
              </label>
            ))}
                     {" "}
          </div>
                 {" "}
        </div>
      ))}
         {" "}
    </div>
     {" "}
  </div>
);

export const ScrutinyApproval = () => {
  const { sendRejectionEmail } = useSendRejectionEmail();
  const { id } = useParams();
  const navigate = useNavigate(); // --- Component State ---

  const [activeTab, setActiveTab] = useState("A");
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [facultyEmail, setFacultyEmail] = useState("");
  const [teacherMail, setTeacherMail] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [fileURLA, setFileURLA] = useState(null);
  const [fileURLB, setFileURLB] = useState(null);

  const defaultChecklistState = scrutinyChecklistItems.map(() => ({
    status: "No",
  }));
  const [checkedStateA, setCheckedStateA] = useState(defaultChecklistState);
  const [checkedStateB, setCheckedStateB] = useState(defaultChecklistState);

  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        const result = await getBySubmissionId(id);
        if (result) {
          setFacultyEmail(result.teacherName || "");
          setTeacherMail(result.uploadedBy || "");
          setSubjectName(result.courseName || "");
          setSubjectCode(result.subjectCode || "");
          setDepartment(result.dept || "");
          setSemester(result.semester || "");
          setYear(result.year || "");
          setFileURLA(result.fileURLA || null);
          setFileURLB(result.fileURLB || null);
          setFeedbackMessages(
            Array.isArray(result.feedback) ? result.feedback : []
          );
          const populateChecklist = (reportData) =>
            scrutinyChecklistItems.map((itemText) => {
              const savedItem = reportData?.find(
                (reportItem) => reportItem.requirement === itemText
              );
              return { status: savedItem?.status || "No" };
            });
          // ✅ FIX: Access the nested scrutinyReport object
          if (result.scrutinyReport && result.scrutinyReport.scrutinyReportA) {
            setCheckedStateA(
              populateChecklist(result.scrutinyReport.scrutinyReportA)
            );
          }
          if (result.scrutinyReport && result.scrutinyReport.scrutinyReportB) {
            setCheckedStateB(
              populateChecklist(result.scrutinyReport.scrutinyReportB)
            );
          }
        }
      } catch (error) {
        console.error("Error fetching submission data:", error);
        toast.error("Failed to fetch submission data.");
      }
    };
    fetchSubmissionData();
  }, [id]);

  const handleRadioChange = (checklistType, position, value) => {
    const updater = (prev) =>
      prev.map((item, index) =>
        index === position ? { ...item, status: value } : item
      );
    if (checklistType === "A") setCheckedStateA(updater);
    else setCheckedStateB(updater);
  };

  const handleGenerateReport = async () => {
    try {
      const formPdfBytes = await fetch(formUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(formPdfBytes);
      const form = pdfDoc.getForm();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontOptions = { font: timesRomanFont };

      // =======================
      // General Information
      // =======================
      form.getField("department_of").setText(department, fontOptions);
      form
        .getField("course_code_&_title")
        .setText(`${subjectCode} - ${subjectName}`, fontOptions);
      form.getField("name_of_the_qp_setter").setText(facultyEmail, fontOptions);
      form
        .getField("name_of_the_qp_scrutinizer")
        .setText(extractName(auth.currentUser?.email), fontOptions);
      form
        .getField("semester_&_branch")
        .setText(`${semester} / ${department}`, fontOptions);
      form
        .getField("date_of_scrutiny")
        .setText(new Date().toLocaleDateString("en-IN"), fontOptions);

      // =======================
      // Checklist Handler
      // =======================
      const processChecklist = (checklistState, prefix) => {
        checklistState.forEach((item, index) => {
          const serial = index + 1;

          // Checkboxes
          const yesField = form.getField(`${prefix}_${serial}_YES`);
          const noField = form.getField(`${prefix}_${serial}_NO`);
          const naField = form.getField(`${prefix}_${serial}_NA`);

          // Remarks (text field)
          const remarkField = form.getField(`${prefix}_${serial}_REMARK`);

          // Reset checkboxes
          yesField?.uncheck?.();
          noField?.uncheck?.();
          naField?.uncheck?.();

          // Apply status
          if (item.status === "Yes") {
            yesField?.check();
          } else if (item.status === "No") {
            noField?.check();
          } else if (item.status === "N/A") {
            naField?.check();
          }

          // Add remark if available
          if (item.remark && remarkField) {
            remarkField.setText(item.remark, fontOptions);
          }
        });

        // === Approval fields (text fields) ===
        const hasNo = checklistState.some((item) => item.status === "No");
        const allYes = checklistState.every((item) => item.status === "Yes");
        const allYesOrNa = checklistState.every(
          (item) => item.status === "Yes" || item.status === "N/A"
        );

        const approvedField = form.getField(
          `${prefix}_Approved_without_correction`
        );
        const resubmitField = form.getField(`${prefix}_Resubmission_Required`);

        // Approved_without_correction
        approvedField?.setText(allYesOrNa ? "YES" : "NO", fontOptions);

        // Resubmission_Required
        if (hasNo) {
          resubmitField?.setText("YES", fontOptions);
        } else if (allYes) {
          resubmitField?.setText("NO", fontOptions);
        } else {
          resubmitField?.setText("NO", fontOptions); // mix of YES + NA
        }
      };

      // =======================
      // Run Checklist for Set A & Set B
      // =======================
      processChecklist(checkedStateA, "setA");
      processChecklist(checkedStateB, "setB");

      // =======================
      // Update appearances
      // =======================
      form.getFields().forEach((field) => {
        if (field instanceof PDFTextField) {
          field.updateAppearances(timesRomanFont);
        } else {
          field.updateAppearances();
        }
      });

      form.flatten();

      // =======================
      // Save and download
      // =======================
      const filledPdfBytes = await pdfDoc.save();
      const blob = new Blob([filledPdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Scrutiny-Report-${subjectCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(link.href);
      link.remove();
      toast.success("Scrutiny report generated and downloaded!");
    } catch (error) {
      console.error("Failed to generate and fill PDF:", error);
      toast.error(
        "Could not generate report. Please check the console for details."
      );
    }
  };

  const handleApprove = async () => {
    const scrutinyReportA = scrutinyChecklistItems.map((req, i) => ({
      requirement: req,
      status: checkedStateA[i].status,
    }));
    const scrutinyReportB = scrutinyChecklistItems.map((req, i) => ({
      requirement: req,
      status: checkedStateB[i].status,
    }));
    try {
      await approveSubmission(id, { scrutinyReportA, scrutinyReportB });
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
    const scrutinyReportA = scrutinyChecklistItems.map((req, i) => ({
      requirement: req,
      status: checkedStateA[i].status,
    }));
    const scrutinyReportB = scrutinyChecklistItems.map((req, i) => ({
      requirement: req,
      status: checkedStateB[i].status,
    }));
    try {
      await provideFeedback(id, newFeedback, {
        scrutinyReportA,
        scrutinyReportB,
      });
      await sendRejectionEmail({
        teacherMail,
        subject: `Question Paper Rejected: ${subjectName} (${subjectCode})`,
        facultyName: facultyEmail,
        feedback: newFeedback,
      });
      toast.info("Submission rejected and email sent to faculty.");
      navigate("/scrutiny");
    } catch (error) {
      toast.error("Failed to reject submission or send email.");
      console.error(error);
    }
  };

  return (
    <div className={styles.editorContainer}>
           {" "}
      <div className={styles.contentWrapper}>
                <h1 className={styles.pageTitle}>Scrutiny & Approval</h1>       {" "}
        <div className={styles.mainContent}>
                   {" "}
          <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Submission Details</h2>
                       {" "}
            <div className={styles.detailsGrid}>
                           {" "}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Faculty Name:</label>
                <input
                  type="text"
                  value={facultyEmail}
                  className={styles.formInput}
                  readOnly
                />
              </div>
                           {" "}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subject:</label>
                <input
                  type="text"
                  value={subjectName}
                  className={styles.formInput}
                  readOnly
                />
              </div>
                           {" "}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subject Code:</label>
                <input
                  type="text"
                  value={subjectCode}
                  className={styles.formInput}
                  readOnly
                />
              </div>
                           {" "}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Department:</label>
                <input
                  type="text"
                  value={department}
                  className={styles.formInput}
                  readOnly
                />
              </div>
                           {" "}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Year / Sem:</label>
                <input
                  type="text"
                  value={`${year} / ${semester}`}
                  className={styles.formInput}
                  readOnly
                />
              </div>
                         {" "}
            </div>
                     {" "}
          </div>
                   {" "}
          <div className={styles.tabContainer}>
                       {" "}
            <button
              onClick={() => setActiveTab("A")}
              className={
                activeTab === "A" ? styles.activeTab : styles.tabButton
              }
            >
              Set A
            </button>
                       {" "}
            <button
              onClick={() => setActiveTab("B")}
              className={
                activeTab === "B" ? styles.activeTab : styles.tabButton
              }
            >
              Set B
            </button>
                     {" "}
          </div>
                   {" "}
          <div className={styles.tabContent}>
                       {" "}
            {activeTab === "A" && (
              <div className={styles.scrutinyPair}>
                               {" "}
                <div
                  className={`${styles.paperColumn} ${styles.stickyPreview}`}
                >
                                   {" "}
                  <div className={styles.card}>
                                       {" "}
                    <div className={styles.previewBox}>
                                           {" "}
                      {fileURLA ? (
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                          <Viewer fileUrl={fileURLA} />
                        </Worker>
                      ) : (
                        <p>Loading document...</p>
                      )}
                                         {" "}
                    </div>
                                     {" "}
                  </div>
                                 {" "}
                </div>
                               {" "}
                <div className={styles.checklistColumn}>
                                   {" "}
                  <ScrutinyChecklist
                    title="Verification Checklist - Set A"
                    items={scrutinyChecklistItems}
                    checkedState={checkedStateA}
                    onStateChange={(index, value) =>
                      handleRadioChange("A", index, value)
                    }
                  />
                                 {" "}
                </div>
                             {" "}
              </div>
            )}
                       {" "}
            {activeTab === "B" && (
              <div className={styles.scrutinyPair}>
                               {" "}
                <div
                  className={`${styles.paperColumn} ${styles.stickyPreview}`}
                >
                                   {" "}
                  <div className={styles.card}>
                                       {" "}
                    <div className={styles.previewBox}>
                                           {" "}
                      {fileURLB ? (
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                          <Viewer fileUrl={fileURLB} />
                        </Worker>
                      ) : (
                        <p>Loading document...</p>
                      )}
                                         {" "}
                    </div>
                                     {" "}
                  </div>
                                 {" "}
                </div>
                               {" "}
                <div className={styles.checklistColumn}>
                                   {" "}
                  <ScrutinyChecklist
                    title="Verification Checklist - Set B"
                    items={scrutinyChecklistItems}
                    checkedState={checkedStateB}
                    onStateChange={(index, value) =>
                      handleRadioChange("B", index, value)
                    }
                  />
                                 {" "}
                </div>
                             {" "}
              </div>
            )}
                     {" "}
          </div>
                   {" "}
          <div className={styles.commonDetails}>
                       {" "}
            <div className={styles.commonActions}>
                           {" "}
              <button
                type="button"
                className={`${styles.actionButton} ${styles.generateReportButton}`}
                onClick={handleGenerateReport}
              >
                Generate & Download Scrutiny Report
              </button>
                         {" "}
            </div>
                       {" "}
            <div className={styles.card}>
                           {" "}
              <h2 className={styles.cardTitle}>Feedback History</h2>           
               {" "}
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
                         {" "}
            </div>
                       {" "}
            <div className={styles.card}>
                           {" "}
              <h2 className={styles.cardTitle}>
                Provide New Feedback (if rejecting)
              </h2>
                           {" "}
              <textarea
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                placeholder="Enter feedback here before rejecting..."
                className={styles.formInput}
                rows={4}
              />
                         {" "}
            </div>
                       {" "}
            <div className={styles.finalActions}>
                           {" "}
              <button
                type="button"
                className={`${styles.actionButton} ${styles.rejectButton}`}
                onClick={handleReject}
              >
                Reject with Feedback
              </button>
                           {" "}
              <button
                type="button"
                className={`${styles.actionButton} ${styles.approveButton}`}
                onClick={handleApprove}
              >
                Approve
              </button>
                         {" "}
            </div>
                     {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default ScrutinyApproval;
