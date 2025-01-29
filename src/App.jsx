import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import TeacherFeedback from "./pages/TeacherFeedback.jsx";
import AdminDashboard from "./pages/AdminDashboard"; // Admin dashboard page
import Dashboard from "./pages/Dashboard";
import NoteEditor from "./pages/Upload.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase"; // Your Firebase config
import UnAuthorized from "./pages/UnAuthorized";
import "./App.css"
import { SelectMembersPage } from "./pages/SelectMembers.jsx";
import ScrutinyDashboard from "./pages/ScrutinyDashboard.jsx";
import ScrutinyApproval from "./pages/ScrutinyApproval.jsx";

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
    return<div className="Loader">
    <div>Loading...</div><div className="loading-spinner"></div>
  </div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/faculty"
          element={
            <ProtectedRoute requiredRole="faculty">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod"
          element={
            <ProtectedRoute requiredRole="faculty">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scrutiny"
          element={
            <ProtectedRoute requiredRole="faculty">
              <ScrutinyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <SelectMembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute requiredRole="faculty">
              <NoteEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/view/:id"
          element={
              <TeacherFeedback />
          }
        />
        <Route
          path="/scrutiny/view/:id"
          element={
              <ScrutinyApproval />
          }
        />
        <Route
          path="/unauthorized"
          element={
              <UnAuthorized />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
