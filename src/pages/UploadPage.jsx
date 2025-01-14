import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Firebase configuration
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getSubmissionsByTeacher } from "../services/questionPaperService";
//import { updateUserRole } from "../services/questionPaperService";

const UploadPage = () => {
  const [subjectCode, setSubjectCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [file, setFile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
       // await updateUserRole(auth.currentUser.email)
        const data = await getSubmissionsByTeacher(auth.currentUser.email);
        console.log(auth.currentUser)
        console.log("Previous teacher data: ", data);
        setSubmissions(data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    fetchSubmissions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!file) {
        toast.error("Please upload a file!");
        return;
      }

      // Add metadata to Firestore
      const docRef = await addDoc(collection(db, "uploads"), {
        subjectCode,
        courseName,
        teacherName,
        fileName: file.name,
        uploadedBy: auth.currentUser.email,
        status: "Under Review",
        uploadedAt: new Date(),
      });

      toast.success("File uploaded successfully!");
      console.log("Document written with ID: ", docRef.id);

      // Reset form
      setSubjectCode("");
      setCourseName("");
      setTeacherName("");
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Upload failed. Please check your permissions.");
    }
  };

  return (
    <div>
      <h1>Upload Question Paper</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Subject Code</label>
          <input
            type="text"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Course Name</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Teacher Name</label>
          <input
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Upload File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </div>
        <button type="submit">Upload</button>
      </form>

      <h1>Previously Submitted</h1>
      {submissions.length > 0 ? (
        submissions.map((sub) => (
          <div key={sub.id}>
            <p>Subject Code: {sub.subjectCode}</p>
            <p>Course Name: {sub.courseName}</p>
            <p>Teacher Name: {sub.teacherName}</p>
            <p>Status: {sub.status}</p>
            {sub.feedback && <p>Feedback: {sub.feedback}</p>}
            <br></br>
          </div>
        ))
      ) : (
        <p>Loading submissions...</p>
      )}
    </div>
  );
};

export default UploadPage;
