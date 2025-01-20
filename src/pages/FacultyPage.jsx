import { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Firebase configuration
import { addDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getSubmissionsByTeacher,
  getSubmissionsByStausAndEmail,
} from "../services/questionPaperService";
import {signOut} from "firebase/auth";
import styles from "./FacultyPage.module.css"
//import { updateUserRole } from "../services/questionPaperService";

const extractName =  (email) => {
  const namePart = email.split('@')[0];
  const firstName = namePart.split('.')[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

const FacultyPage = () => {
  const [subjectCode, setSubjectCode] = useState("");
  const [department, setDepartment] = useState("");
  const [courseName, setCourseName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [file, setFile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const navigate = useNavigate();
 
 
  
  const deleteBtn = <button className={styles.deleteBtn}><svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><path d="M667.8 362.1H304V830c0 28.2 23 51 51.3 51h312.4c28.4 0 51.4-22.8 51.4-51V362.2h-51.3z" fill="#ffffff"></path><path d="M750.3 295.2c0-8.9-7.6-16.1-17-16.1H289.9c-9.4 0-17 7.2-17 16.1v50.9c0 8.9 7.6 16.1 17 16.1h443.4c9.4 0 17-7.2 17-16.1v-50.9z" fill="#ffffff"></path><path d="M733.3 258.3H626.6V196c0-11.5-9.3-20.8-20.8-20.8H419.1c-11.5 0-20.8 9.3-20.8 20.8v62.3H289.9c-20.8 0-37.7 16.5-37.7 36.8V346c0 18.1 13.5 33.1 31.1 36.2V830c0 39.6 32.3 71.8 72.1 71.8h312.4c39.8 0 72.1-32.2 72.1-71.8V382.2c17.7-3.1 31.1-18.1 31.1-36.2v-50.9c0.1-20.2-16.9-36.8-37.7-36.8z m-293.5-41.5h145.3v41.5H439.8v-41.5z m-146.2 83.1H729.5v41.5H293.6v-41.5z m404.8 530.2c0 16.7-13.7 30.3-30.6 30.3H355.4c-16.9 0-30.6-13.6-30.6-30.3V382.9h373.6v447.2z" fill="#c81919"></path><path d="M511.6 798.9c11.5 0 20.8-9.3 20.8-20.8V466.8c0-11.5-9.3-20.8-20.8-20.8s-20.8 9.3-20.8 20.8v311.4c0 11.4 9.3 20.7 20.8 20.7zM407.8 798.9c11.5 0 20.8-9.3 20.8-20.8V466.8c0-11.5-9.3-20.8-20.8-20.8s-20.8 9.3-20.8 20.8v311.4c0.1 11.4 9.4 20.7 20.8 20.7zM615.4 799.6c11.5 0 20.8-9.3 20.8-20.8V467.4c0-11.5-9.3-20.8-20.8-20.8s-20.8 9.3-20.8 20.8v311.4c0 11.5 9.3 20.8 20.8 20.8z" fill="#c81919"></path></svg></button>
  const editBtn = <button className={styles.editBtn}><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.56078 20.2501L20.5608 8.25011L15.7501 3.43945L3.75012 15.4395V20.2501H8.56078ZM15.7501 5.56077L18.4395 8.25011L16.5001 10.1895L13.8108 7.50013L15.7501 5.56077ZM12.7501 8.56079L15.4395 11.2501L7.93946 18.7501H5.25012L5.25012 16.0608L12.7501 8.56079Z" fill="#107023"></path></svg></button>
 

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // await updateUserRole(auth.currentUser.email)
        const data = await getSubmissionsByTeacher(auth.currentUser.email);
        //console.log("TEST appproved:",await getSubmissionsByStausAndEmail(auth.currentUser.email,"Approved"))
        console.log(auth.currentUser);

        console.log(extractName(auth.currentUser.email));

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
        status: "Pending",
        dept: department,
        uploadedAt: new Date(),
      });

      toast.success("File uploaded successfully!");
      console.log("Document written with ID: ", docRef.id);

      // Reset form
      setSubjectCode("");
      setCourseName("");
      setTeacherName("");
      setDepartment("");
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Upload failed. Please check your permissions.");
    }
  };

  const getStatus = (status) =>{
    if(status === "Pending"){
      return <h3 className={styles.orange} >Pending</h3>
    }
    else if(status === "Approved"){
      return <h3 className={styles.green} >Approved</h3>
    }else if (status === "Rejected"){
      return <h3 className={styles.red} >Rejected</h3>
    }
  }



  return (
    <div className={styles.mainContainer}>
      <div className={styles.profileSection}>
        <div className={styles.profileDetails}>
          <svg className={styles.profileIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.4" d="M12.1207 12.78C12.0507 12.77 11.9607 12.77 11.8807 12.78C10.1207 12.72 8.7207 11.28 8.7207 9.50998C8.7207 7.69998 10.1807 6.22998 12.0007 6.22998C13.8107 6.22998 15.2807 7.69998 15.2807 9.50998C15.2707 11.28 13.8807 12.72 12.1207 12.78Z" stroke="#154784" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path opacity="0.34" d="M18.7398 19.3801C16.9598 21.0101 14.5998 22.0001 11.9998 22.0001C9.39977 22.0001 7.03977 21.0101 5.25977 19.3801C5.35977 18.4401 5.95977 17.5201 7.02977 16.8001C9.76977 14.9801 14.2498 14.9801 16.9698 16.8001C18.0398 17.5201 18.6398 18.4401 18.7398 19.3801Z" stroke="#154784" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#154784" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>
          <div className={styles.subProfileDetails}>
            <h2 className={styles.name}>{extractName(auth.currentUser.email)}</h2>
            <h2 className={styles.mail}>{auth.currentUser.email}</h2>
          </div>
        </div>


        <ul className={styles.buttonList}>
          <li>
          <h1>Submission Details</h1>
          <br />
          </li>
          <li>
            <button
              className={styles.all}
              onClick={async () => {
                try {
                  const data = await getSubmissionsByTeacher(auth.currentUser.email);
                  setSubmissions(data);
                } catch (error) {
                  console.error("Error fetching all submissions:", error);
                }
              }}
            >
              All 
            </button>
          </li>
          <li>
            <button
              className={styles.pending}
              onClick={async () => {
                try {
                  const data = await getSubmissionsByStausAndEmail(
                    auth.currentUser.email,
                    "Pending"
                  );
                  setSubmissions(data);
                } catch (error) {
                  console.error("Error fetching pending submissions:", error);
                }
              }}
            >
              Pending
            </button>
          </li>
          <li>
            <button
              className={styles.approved}
              onClick={async () => {
                try {
                  const data = await getSubmissionsByStausAndEmail(
                    auth.currentUser.email,
                    "Approved"
                  );
                  setSubmissions(data);
                } catch (error) {
                  console.error("Error fetching approved submissions:", error);
                }
              }}
            >
              Approved
            </button>
          </li>
          <li>
            <button
              className={styles.rejected}
              onClick={async () => {
                try {
                  const data = await getSubmissionsByStausAndEmail(
                    auth.currentUser.email,
                    "Rejected"
                  );
                  setSubmissions(data);
                } catch (error) {
                  console.error("Error fetching rejected submissions:", error);
                }
              }}
            >
              Rejected
            </button>
          </li>
          <li>            <button className={styles.signOut} 
          onClick={async () => {
            try {
              await signOut(auth); // Sign out the user
              navigate("/", { replace: true });
              window.location.reload(); // Redirect to login page
              toast.success("You have been signed out!");
            } catch (error) {
              console.error("Error during sign out:", error);
              toast.error("Sign out failed. Please try again.");
            }
          }}
          >Sign Out</button>
          </li>
          <li>
            <button className={styles.signOut} onClick={ ()=>{navigate("/admin-dashboard")}} >See admin (temp button )</button>
          </li>
        </ul>

      </div>


      <div className={styles.contents}>
        <div className={styles.display}>
        <h4>Faculty Dashboard</h4>
        </div>
        <br />
        <h1>Upload Question Paper :</h1>
        <br />
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputs}>
            <label>Subject Code</label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputs}>
            <label>Course Name</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputs}>
            <label>Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputs}>
            <label>Teacher Name</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.uploadSection}>
              
            <div>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
            </div>
            <button className={styles.uploadBtn} type="submit">
                          
                        <svg viewBox="0 0 1024 1024" className="icon" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                <path d="M768 810.7c-23.6 0-42.7-19.1-42.7-42.7s19.1-42.7 42.7-42.7c94.1 0 170.7-76.6 170.7-170.7 0-89.6-70.1-164.3-159.5-170.1L754 383l-10.7-22.7c-42.2-89.3-133-147-231.3-147s-189.1 57.7-231.3 147L270 383l-25.1 1.6c-89.5 5.8-159.5 80.5-159.5 170.1 0 94.1 76.6 170.7 170.7 170.7 23.6 0 42.7 19.1 42.7 42.7s-19.1 42.7-42.7 42.7c-141.2 0-256-114.8-256-256 0-126.1 92.5-232.5 214.7-252.4C274.8 195.7 388.9 128 512 128s237.2 67.7 297.3 174.2C931.5 322.1 1024 428.6 1024 554.7c0 141.1-114.8 256-256 256z" fill="#1472ff"></path>
                <path d="M640 789.3c-10.9 0-21.8-4.2-30.2-12.5L512 679l-97.8 97.8c-16.6 16.7-43.7 16.7-60.3 0-16.7-16.7-16.7-43.7 0-60.3l128-128c16.6-16.7 43.7-16.7 60.3 0l128 128c16.7 16.7 16.7 43.7 0 60.3-8.4 8.4-19.3 12.5-30.2 12.5z" fill="#4d537a"></path>
                <path d="M512 960c-23.6 0-42.7-19.1-42.7-42.7V618.7c0-23.6 19.1-42.7 42.7-42.7s42.7 19.1 42.7 42.7v298.7c0 23.5-19.1 42.6-42.7 42.6z" fill="#4d537a"></path></svg>

                </button>
            </div>
                            


        </form>
        
        <br />
        <h1>Previous Submissions : </h1>
        <br />
        <div className= {styles.tableHeader}>
              <div className= {styles.columns}><h3>Subject Code</h3> </div>
              <div className= {styles.columns}><h3>Course Name </h3></div>
              <div className= {styles.columns}><h3>Date </h3></div>
              <div className= {styles.columns}><h3>Time </h3></div>
              <div className= {styles.columns}><h3>Status </h3></div>
              
          </div>
        { 
        submissions.length > 0 ? (
          submissions.map((sub) => (
            
            <div key={sub.id} className= {styles.row}>
              

              <div className={styles.table}>
                <div className= {styles.columns}><h3>{sub.subjectCode}</h3></div>
                <div className= {styles.columns}><h3>{sub.courseName}</h3></div>
                <div className= {styles.columns}><h3>{sub.date}</h3></div>
                <div className= {styles.columns}> <h3>{sub.time}</h3></div>
                <div className= {styles.columns}><h3>{getStatus(sub.status)}</h3></div>
              </div>

              <div className= {styles.feedback}><h3> <span className= {styles.FeedbackSpan}>Feedback  :</span>  {sub.feedback ? sub.feedback : "...." }</h3> {(sub.status == "Pending") ? [editBtn , deleteBtn] : <></>} </div>
              
              
              
              
              
            </div>
            
          ))
        ) : (
          <div className= {styles.noData} >No available data...</div>
        )}
      </div>
    </div>
  );
};

export default FacultyPage;
