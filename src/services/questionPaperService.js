import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
  getDoc 
} from "firebase/firestore";
import { db } from "../firebase"; // Firebase configuration
import { Navigate } from "react-router-dom";

const submissions = [];

export const uploadQuestionPaper = (data) => {
  submissions.push({ ...data, id: submissions.length + 1, status: "Pending" });
};

export const getSubmissions = () => submissions;
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

    const documents = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Check if `uploadedAt` exists and is a Firestore timestamp
      const uploadedAt = data.uploadedAt;
      let date = null;
      let time = null;

      if (uploadedAt && uploadedAt.seconds) {
        // Convert Firestore Timestamp to a Date object
        const dateObj = new Date(uploadedAt.seconds * 1000); // seconds to milliseconds

        // Format the date and time
        date = dateObj.toLocaleDateString(); // e.g., "1/19/2025"
        time = dateObj.toLocaleTimeString(); // e.g., "2:45:30 PM"
      }

      return {
        id: doc.id,
        ...data,
        date, // Adds the formatted date
        time, // Adds the formatted time
      };
    });

    console.log("Submissions:", status, documents);
    return documents;
  } catch (error) {
    console.error("Error fetching submissions by status and email:", error);
    return [];
  }
};

// for teachers to get details by id
export const getById = async (email) => {
  try {
    const collectionRef = collection(db, "uploads");
    const q = query(collectionRef, where("uploadedBy", "==", email));
    const querySnapshot = await getDocs(q);

    // Filter the documents to only include the one with the matching id
    console.log(
      "Documents fetched:",
      querySnapshot.docs.map((doc) => doc.id)
    );
    const filteredDocument = querySnapshot.docs.find(
      (doc) => doc.id === "AhQFRyo60ZMRPARE6RRs"
    );
    if (filteredDocument) {
      console.log("Filtered Document:", filteredDocument.data());
      return {
        id: filteredDocument.id,
        ...filteredDocument.data(),
      };
    } else {
      console.log("No document found with the given ID.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching filtered submissions:", error);
    throw error;
  }
};
export const getBySubmissionId = async (id) => {
  try {
    // Use the `doc()` method to point to the specific document by its ID
    const docRef = doc(db, "uploads", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      console.log("No document found with the given ID.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching document by ID:", error);
    throw error;
  }
};

// for teachers to get all the submission submitted by them
// export const getSubmissionsByTeacher = async (email) => {
//   try {
//     const collectionRef = collection(db, "uploads");
//     const q = query(collectionRef, where("uploadedBy", "==", email));
//     const data = doc.data();
//     const timestamp = data.timestamp ? data.timestamp.toDate() : null;
//     const formattedDateTime = timestamp.toLocaleString();
//     const [date, time] = formattedDateTime.split(", ");
//     const querySnapshot = await getDocs(q);
//     return querySnapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//       date,
//       time,
//     }));
//   } catch (error) {
//     console.error("Error fetching filtered submissions:", error);
//     throw error;
//   }
// };

// for teachers to get all the submission submitted by them
// export const getSubmissionsByTeacher = async (email) => {
//   try {
//     const collectionRef = collection(db, "uploads");
//     const q = query(collectionRef, where("uploadedBy", "==", email));
//     const querySnapshot = await getDocs(q);

//     return querySnapshot.docs.map((doc) => {
//       const data = doc.data();
//       const timestamp = data.timestamp ? data.timestamp.toDate() : null;

//       let date = null;
//       let time = null;

//       if (timestamp) {
//         const formattedDateTime = timestamp.toLocaleString(); // Example: "1/19/2025, 2:45:30 PM"
//         [date, time] = formattedDateTime.split(", "); // Split into date and time
//       }

//       console.log(date, time);

//       return {
//         id: doc.id,
//         ...data,
//         date, // Include date as a separate field
//         time, // Include time as a separate field
//       };
//     });
//   } catch (error) {
//     console.error("Error fetching filtered submissions:", error);
//     throw error;
//   }
// };

// export const getSubmissionsByTeacher = async (email) => {
//   try {
//     const collectionRef = collection(db, "uploads");
//     const q = query(collectionRef, where("uploadedBy", "==", email));
//     const querySnapshot = await getDocs(q);

//     return querySnapshot.docs.map((doc) => {
//       const data = doc.data();
//       const timestamp = data._timestamp ? data._timestamp.toDate() : null;

//       let date = null;
//       let time = null;

//       if (timestamp) {
//         const formattedDateTime = timestamp.toLocaleString(); // Formats to "MM/DD/YYYY, HH:MM:SS AM/PM"
//         [date, time] = formattedDateTime.split(", "); // Splits into date and time
//       } else {
//         console.warn(`Missing timestamp for document ID: ${doc.id}`);
//       }

//       return {
//         id: doc.id,
//         ...data,
//         date, // Example: "01/19/2025"
//         time, // Example: "2:45:30 PM"
//       };
//     });
//   } catch (error) {
//     console.error("Error fetching filtered submissions:", error);
//     throw error;
//   }
// };

export const getUserDepartment = async (email) => { // Get the current logged-in user

  if (email) {
    try {
      // Get reference to the user's document in Firestore
      const userDocRef = doc(db, "users", email); // Assuming the users are stored in the "users" collection
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const department = userDocSnap.data().department; // Get the department field
        console.log('User department:', department);
        return department; // Return the department value
      } else {
        console.log("No such user document!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user department:", error);
      return null;
    }
  } else {
    console.log("No user is currently logged in.");
    return null;
  }
};


export const getSubmissionsByTeacher = async (email) => {
  try {
    const collectionRef = collection(db, "uploads");
    const q = query(collectionRef, where("uploadedBy", "==", email));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Check if `uploadedAt` exists and is a Firestore timestamp
      const uploadedAt = data.uploadedAt;
      let date = null;
      let time = null;

      if (uploadedAt && uploadedAt.seconds) {
        // Convert Firestore Timestamp to a Date object
        const dateObj = new Date(uploadedAt.seconds * 1000); // seconds to milliseconds

        // Format the date and time
        date = dateObj.toLocaleDateString(); // e.g., "1/19/2025"
        time = dateObj.toLocaleTimeString(); // e.g., "2:45:30 PM"
      }

      return {
        id: doc.id,
        ...data,
        date, // Adds the formatted date
        time, // Adds the formatted time
      };
    });
  } catch (error) {
    console.error("Error fetching filtered submissions:", error);
    throw error;
  }
};
export const getSubmissionsByDepartment = async (department) => {
  try {
    const collectionRef = collection(db, "uploads");
    const q = query(collectionRef, where("dept", "==", department));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Check if `uploadedAt` exists and is a Firestore timestamp
      const uploadedAt = data.uploadedAt;
      let date = null;
      let time = null;

      if (uploadedAt && uploadedAt.seconds) {
        // Convert Firestore Timestamp to a Date object
        const dateObj = new Date(uploadedAt.seconds * 1000); // seconds to milliseconds

        // Format the date and time
        date = dateObj.toLocaleDateString(); // e.g., "1/19/2025"
        time = dateObj.toLocaleTimeString(); // e.g., "2:45:30 PM"
      }

      return {
        id: doc.id,
        ...data,
        date, // Adds the formatted date
        time, // Adds the formatted time
      };
    });
  } catch (error) {
    console.error("Error fetching filtered submissions:", error);
    throw error;
  }
};

export const provideFeedback = async (id, feedback) => {
  try {
    if (!Array.isArray(feedback)) {
      throw new TypeError("Feedback must be an array.");
    }

    const docRef = doc(db, "uploads", id);
    
    // Fetch the current document data
    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
      const existingFeedback = docSnapshot.data().feedback || []; // Ensure it's an array

      // Append the new feedback
      const updatedFeedback = [...existingFeedback, ...feedback];

      // Update the feedback and status fields
      await updateDoc(docRef, { feedback: updatedFeedback, status: "Rejected" });

      console.log(`Feedback added to submission with ID: ${id}`);
    } else {
      console.error("Document not found");
    }
  } catch (error) {
    console.error("Error providing feedback:", error);
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

export const getAllSubmissions = async () => {
  try {
    const collectionRef = collection(db, "uploads");
    const querySnapshot = await getDocs(collectionRef);

    const documents = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Check if `uploadedAt` exists and is a Firestore timestamp
      const uploadedAt = data.uploadedAt;
      let date = null;
      let time = null;

      if (uploadedAt && uploadedAt.seconds) {
        // Convert Firestore Timestamp to a Date object
        const dateObj = new Date(uploadedAt.seconds * 1000); // seconds to milliseconds

        // Format the date and time
        date = dateObj.toLocaleDateString(); // e.g., "1/19/2025"
        time = dateObj.toLocaleTimeString(); // e.g., "2:45:30 PM"
      }

      return {
        id: doc.id,
        ...data,
        date, // Adds the formatted date
        time, // Adds the formatted time
      };
    });

    console.log("All Submissions:", documents);
    return documents;
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    return [];
  }
};

export const getAllSubmissionsByStatus = async (status) => {
  try {
    const collectionRef = collection(db, "uploads");
    const q = query(collectionRef, where("status", "==", status));
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Check if `uploadedAt` exists and is a Firestore timestamp
      const uploadedAt = data.uploadedAt;
      let date = null;
      let time = null;

      if (uploadedAt && uploadedAt.seconds) {
        // Convert Firestore Timestamp to a Date object
        const dateObj = new Date(uploadedAt.seconds * 1000); // seconds to milliseconds

        // Format the date and time
        date = dateObj.toLocaleDateString(); // e.g., "1/19/2025"
        time = dateObj.toLocaleTimeString(); // e.g., "2:45:30 PM"
      }

      return {
        id: doc.id,
        ...data,
        date, // Adds the formatted date
        time, // Adds the formatted time
      };
    });

    console.log("All Submissions:", documents);
    return documents;
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    return [];
  }
};
