import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
  getDoc ,
  arrayUnion,
  deleteDoc ,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase"; // Firebase configuration


const submissions = [];
export const departmentsList = ["CE","CSE","ECE","EEE","ME","MR","AD","CY","Common Subjects"];

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
    if (typeof feedback !== "string") {
      throw new TypeError("Feedback must be a string.");
    }

    const docRef = doc(db, "uploads", id);

    // Use Firestore's arrayUnion to append feedback
    await updateDoc(docRef, {
      feedback: arrayUnion(feedback),
      status: "Rejected",
    });

    console.log(`Feedback added to submission with ID: ${id}`);
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

const extractName = (email) => {
  if (!email || typeof email !== "string") {
    console.error("Invalid email provided:", email);
    return "Unknown"; // Default value if email is invalid
  }

  const namePart = email.split("@")[0];
  const firstName = namePart.split(".")[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

export const getAllUsers = async () => {
  try {
    const usersCollectionRef = collection(db, "users");
    const querySnapshot = await getDocs(usersCollectionRef);

    const users = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || "unknown@example.com", // Ensure email exists
        name: extractName(data.email), // Extract name from email
        department: data.department || "Not Assigned", // Provide default department
      };
    });

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const createUser = async (userId, email, name, department, role) => {  
  try {  
    const userDocRef = doc(db, "users", userId);  
    await setDoc(userDocRef, {  
      email,  
      name,  
      department,  
      role  
    });  
    console.log(`User ${userId} created successfully`);  
    return true;  
  } catch (error) {  
    console.error("Error creating user:", error);  
    return false;  
  }  
};


export const deleteUser = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await deleteDoc(userDocRef);
    console.log(`User ${userId} deleted successfully`);
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

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
