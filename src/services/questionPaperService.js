import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase"; // Firebase configuration

const submissions = [];

export const uploadQuestionPaper = (data) => {
  submissions.push({ ...data, id: submissions.length + 1, status: "Pending" });
};

// export const getSubmissions = () => submissions;
// get submissions based on status
// for Admin
export const getApprovedSubmissions = async (status) => {
  try {
    const collectionRef = collection(db, "uploads");
    const approvedQuery = query(collectionRef, where("status", "==", status));
    const querySnapshot = await getDocs(approvedQuery);

    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Approved Submissions:", documents);
    return documents;
  } catch (error) {
    console.error("Error fetching approved submissions:", error);
    return [];
  }
};

// For teachers to sort through submission
export const getSubmissionsByStausAndEmail = async (email, status) => {
  try {
    const collectionRef = collection(db, "uploads");
    const submissionsQuery = query(
      collectionRef,
      where("uploadedBy", "==", email),
      where("status", "==", status)
    );
    const querySnapshot = await getDocs(submissionsQuery);

    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Approved Submissions:", documents);
    return documents;
  } catch (error) {
    console.error("Error fetching approved submissions:", error);
    return [];
  }
};

// for teachers to get all the submission submitted by them
export const getSubmissionsByTeacher = async (email) => {
  try {
    const collectionRef = collection(db, "uploads");
    const q = query(collectionRef, where("uploadedBy", "==", email));
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

export const provideFeedback = async (id, feedback) => {
  try {
    const docRef = doc(db, "uploads", id);
    await updateDoc(docRef, { feedback });
    await updateDoc(docRef, { status: "Pending Revision" });

    console.log(`Feedback added to submission with ID: ${id}`);
  } catch (error) {
    console.error("Error providing feedback:", error);
    throw error;
  }
};

export const approveSubmission = async (id) => {
  try {
    const docRef = doc(db, "uploads", id);
    await updateDoc(docRef, { status: "Approved" });
    console.log(`Submission with ID: ${id} approved`);
  } catch (error) {
    console.error("Error approving submission:", error);
    throw error;
  }
};

// export const updateUserRole = async (email) => {
//   try {
//     // Reference the user document in Firestore
//     const userDocRef = doc(db, "users", email);

//     // Update the user's role
//     await updateDoc(userDocRef, { role: "sadmin" });

//   } catch (error) {
//     console.error("Error updating user role:", error);
//   }
// };
