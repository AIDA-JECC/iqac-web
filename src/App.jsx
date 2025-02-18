import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import TeacherFeedback from "./pages/TeacherFeedback.jsx";
// import AdminDashboard from "./pages/AdminDashboard"; // Admin dashboard page
import Dashboard from "./pages/Dashboard";
import NoteEditor from "./pages/Upload.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase"; // Your Firebase config
import UnAuthorized from "./pages/UnAuthorized";
import "./App.css";
import { SelectMembersPage } from "./pages/SelectMembers.jsx";
import { ApprovedPapers } from "./pages/ApprovedPapers.jsx";
import ScrutinyDashboard from "./pages/ScrutinyDashboard.jsx";
import ScrutinyApproval from "./pages/ScrutinyApproval.jsx";
import AddUser from "./pages/AddUser.jsx";
import CreateFaculty from "./pages/CreateFaculty.jsx";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Stop loading once the auth state is determined
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="Loader">
        <div>Loading...</div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/faculty"
          element={
            <ProtectedRoute requiredRoles={["faculty", "admin"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/hod"
          element={
            <ProtectedRoute requiredRole="faculty">
              <Dashboard />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/approved-papers"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <ApprovedPapers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scrutiny"
          element={
            <ProtectedRoute requiredRoles={["faculty", "admin"]}>
              <ScrutinyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <SelectMembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute requiredRoles={["faculty", "admin"]}>
              <NoteEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-user"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <AddUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/create"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <CreateFaculty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/view/:id"
          element={
            <ProtectedRoute requiredRoles={["faculty", "admin"]}>
              <TeacherFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scrutiny/view/:id"
          element={
            <ProtectedRoute requiredRoles={["faculty", "admin"]}>
              <ScrutinyApproval />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<UnAuthorized />} />
      </Routes>
    </Router>
  );
};

export default App;
