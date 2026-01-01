// src/App.jsx
import { Routes, Route, useLocation, useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// pages / components
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import ProjectsPage from "./pages/ProjectsPage";
import TasksPage from "./pages/TasksPage";
import Home from "./pages/Home.jsx";
import NavBar from "./components/NavBar";
import Regester from "./pages/Regester";
import LogIn from "./pages/LogIn";
import ProtectedRoute from "./components/ProtectedPath.jsx";
import ViewProject from "./components/ViewProject.jsx";
import ViweerSingelTaske from "./pages/ViweerSingelTaske.jsx";
import User from "./pages/User.jsx";
import PageSlide from "./components/PageSlide.jsx";
import PageFade from "./components/PageFade.jsx";
import AnimatedSelect from "./components/AnimatedSelect";
import CreaateProject from "./pages/CreaateProject.jsx";
import AddTaskToProject from "./pages/AddTaskToProject .jsx";
import Notifications from "./pages/Notifications.jsx";

// slices / thunks
import { fetchUsers } from "./slices/AuthSlice.js";

// RTK Query hooks (تأكد المسار صحيح)
import { archiveProject, fetchProjects, hideProject, deletePermanentlyProject } from "./slices/projectsSlice.js";
import { fetchNotifications } from "./slices/notificationsSlice.js";
import { setOpenDiitailsDelete } from "./slices/Modals.js";




const DitailsOfDelete = ({ project, list, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();


  return (
    <motion.div
      className="fixed inset-0 bg-[#757373] bg-opacity-40 flex items-center justify-center z-50"
      key='overLay'
      // Animation for the overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}

      transition={{ type: "spring", duration: 100, stiffness: 1000, damping: 25 }}
    >
      {/* المربع */}
      <motion.div
        className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md"

        // Animation for the modal box
        initial={{ opacity: 0, scale: 0, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0, y: -20 }}

        transition={{ type: "spring", duration: 100, stiffness: 600, damping: 25 }}
      >
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
        >
          X
        </button>
        <h4 className="text-red-700 font-bold text-lg mb-3">
          Make your decision by choosing an option ?
        </h4>

        <p className="text-gray-700 mb-6">
          This action cannot be undone.
        </p>

        <div className="flex justify-end rounded p-1">
          <div className="w-56">
            <AnimatedSelect
              placeholder="--Choose--"
              options={[
                { value: "", label: "--Choose--", },
                { value: "hide", label: "Hide", func: (project) => list.hide(project) },
                { value: "delete", label: "Delete", func: (project) => list.delete(project) },
                { value: "archive", label: "Archive", func: (project) => list.archive(project) },
                { value: "stop", label: "Stop support", func: (project) => console.log(project) },
              ]}
              onChange={(opt) => {
                if (!opt || !opt.value) return;
                opt.func(project);

                navigate('/')

                // close the dialog for any selection
                onClose();
              }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const Project = useSelector((s) => s.projects.selectProject);
  const Tasks = useSelector(s => s.projects)

  const navigate = useNavigate();
  const OpenDatilsDeleteProject = useSelector((s) => s.modals.OpenDatilsDeleteProject);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel("task-manager-channel");
    ch.onmessage = (ev) => {
      const { type } = ev.data || {};
      if (type === "notifications:updated") {
        // invalidates tags => ستجبر RTKQ على إعادة جلب notifications
        dispatch(api.util.invalidateTags([{ type: "Notifications", id: "LIST" }]));
      }
    };
    return () => ch.close();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProjects());

    dispatch(fetchNotifications());
    dispatch(fetchUsers());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-100">
      <AnimatePresence mode="sync">
        {OpenDatilsDeleteProject && (
          <DitailsOfDelete project={Project} onClose={e => dispatch(setOpenDiitailsDelete(false))} list={{
            hide: (proj) => dispatch(hideProject(proj)),
            
            delete: (proj) => dispatch(deletePermanentlyProject(proj)),
            archive: (proj) => dispatch(archiveProject(proj)),
          }} onDelete={(proj) => {
            dispatch(archiveProject(proj))
            navigate('/')
          }} />
        )}
      </AnimatePresence>
      <NavBar />

      <main className="container mx-auto my-15 px-4 py-6">

        {/* مثال: لو عايز Loader عام */}
        {/* {appLoading && (
          <div className="mb-4 text-center">
            <span>Loading data…</span>
          </div>
        )} */}

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <PageSlide><Home /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <PageSlide><Notifications /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <PageSlide><Dashboard /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <PageSlide><UsersPage /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  {/* ProjectsPage لازم يتعامل مع البيانات عبر RTK Query أو يستلم props */}
                  <PageSlide>
                    <ProjectsPage />
                  </PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <PageSlide><ViewProject /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <PageSlide><TasksPage /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <PageSlide><ViweerSingelTaske /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-taske-to-project/:projectId?"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PageSlide><AddTaskToProject /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/user/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "user"]}>
                  <PageSlide><User /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-project"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PageSlide><CreaateProject /></PageSlide>
                </ProtectedRoute>
              }
            />

            <Route path="/regester" element={<PageFade><Regester /></PageFade>} />
            <Route path="/log_in" element={<PageFade><LogIn /></PageFade>} />

            <Route path="*" element={<PageFade><div>404 Not Found</div></PageFade>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

