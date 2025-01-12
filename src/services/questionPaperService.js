import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase"; // Firebase configuration

const submissions = [];

export const uploadQuestionPaper = (data) => {
  submissions.push({ ...data, id: submissions.length + 1, status: "Pending" });
};

// export const getSubmissions = () => submissions;
export const getSubmissions = async () => {
  const collectionRef = collection(db, "uploads");
  const querySnapshot = await getDocs(collectionRef);
  const documents = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log("Fetched Documents:", documents);
  return documents;
};

export const getSubmissionsByTeacher = async (name) => {
  try {
    const collectionRef = collection(db, "uploads"); 
    const q = query(collectionRef, where("teacherName", "==", name)); 
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching filtered submissions:", error);
    throw error;
  }
};

export const provideFeedback = (id, feedback) => {
  const submission = submissions.find((sub) => sub.id === id);
  if (submission) {
    submission.feedback = feedback;
  }
};

export const approveSubmission = (id) => {
  const submission = submissions.find((sub) => sub.id === id);
  if (submission) {
    submission.status = "Approved";
  }
};
