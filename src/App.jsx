// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import ProjectsPage from "./pages/ProjectsPage";
import TasksPage from "./pages/TasksPage";
import Home from "./pages/Home.jsx";
import NavBar from "./components/NavBar";
import Regester from "./pages/Regester";
import LogIn from "./pages/LogIn";
import ProtectedRoute from "./components/ProtectedPath.jsx";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects } from "./slices/projectsSlice.js";
import ViewProject from "./components/ViewProject.jsx";
import ViweerSingelTaske from "./pages/ViweerSingelTaske.jsx";
import { fetchUsers } from "./slices/AuthSlice.js";
import User from "./pages/User.jsx";
import PageSlide from "./components/PageSlide.jsx"; // ✅
import PageFade from "./components/PageFade.jsx";   // ✅ (للصفحات اللي عايزها فِيد)
import CreaateProject from "./pages/CreaateProject.jsx";
import AddTaskToProject from "./pages/AddTaskToProject .jsx";

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation(); // ✅ مهم للأنيميشن

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchUsers());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />

      <main className="container mx-auto my-15  px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ✅ المفتاح على الـ pathname عشان exit يشتغل */}
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><Home /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><Dashboard /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><UsersPage /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><ProjectsPage /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><ViewProject /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><TasksPage /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><ViweerSingelTaske /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-taske-to-project/"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><AddTaskToProject /></PageSlide>
                </ProtectedRoute>
              }
            />


            <Route
              path="/user/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><User /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-project"
              element={
                <ProtectedRoute allowedRoles={["admin", "developer"]}>
                  <PageSlide><CreaateProject /></PageSlide>
                </ProtectedRoute>
              }
            />

            {/* صفحات الأوث نعملها Fade أهدى */}
            <Route path="/regester" element={<PageFade><Regester /></PageFade>} />
            <Route path="/log_in" element={<PageFade><LogIn /></PageFade>} />

            <Route path="*" element={<PageFade><div>404 Not Found</div></PageFade>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div >
  );
}
