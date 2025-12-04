// pages/Dashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut } from 'lucide-react';
import { logoutUser } from '../slices/AuthSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import { archiveProject, toggleProjectHidden, hideProject } from '../slices/projectsSlice';
import ProjectSection from '../typs/TypsOfNavigates';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const users = useSelector((state: any) => state.auth.usersList);
  const { user, logoutLoading } = useSelector((state: any) => state.auth);
  const projects = useSelector((state: any) => state.projects.list);
  const tasks = useSelector((state: any) => state.projects.tasks);

  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Scroll + Highlight
  useEffect(() => {
    if (location.state?.scroll) {
      const element = document.getElementById(location.state.scroll);
      if (element) {
        // Scroll للمنتصف
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);

        window.scrollTo({ top: middle, behavior: 'smooth' });

        // Highlight
        setHighlightId(location.state.scroll);

        const timeout = setTimeout(() => {
          setHighlightId(null); // نمسح highlight
          navigate(location.pathname, { replace: true, state: {} }); // نمسح state بعد الانتهاء
        }, 800);

        return () => clearTimeout(timeout); // cleanup
      }
    }
  }, [location.state]);



  // Logout handler
  const handelLogOut = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => navigate("/"))
      .catch((err) => console.log("❌ Logout error:", err));
  };

  // Filtered projects for sections
  const activeProjects = useMemo(
    () => projects.filter(p => p.status === 'active' && !p.hidden),
    [projects]
  );
  const hiddenProjects = useMemo(
    () => projects.filter(p => p.hidden),
    [projects]
  );
  const archivedProjects = useMemo(
    () => projects.filter(p => ['completed', 'archived'].includes(p.status)),
    [projects]
  );

  // Actions
  const handleToggleHidden = (project: any) => {
    dispatch(hideProject(project));
    dispatch(toggleProjectHidden(project.id)); // مشكلتك في إداره الحاله عشان انتا محدثتش الستور
  };

  const handleRestoreProject = (project: any) => {
    dispatch(archiveProject({ ...project, status: 'active' }));
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>{user?.name?.slice(0, 8)}</span>
          <button onClick={handelLogOut}>
            {!logoutLoading ? <LogOut /> : <div>...Logging Out</div>}
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Users" count={users?.length} color="blue" />
        <StatCard title="Projects" count={projects?.length} color="green" />
        <StatCard
          title="Tasks"
          count={tasks?.length}
          color="purple"
          completed={tasks?.filter((t: any) => t.completed).length}
        />
      </div>

      {/* Projects Sections (admin only) */}
      {user?.role === 'admin' && (
        <div className="space-y-6">
          <ProjectsSection
            idS={ProjectSection.ACTIVE}
            title="Active Projects"
            projects={activeProjects}
            onToggleHidden={handleToggleHidden}
            onRestore={handleRestoreProject}
            highlightId={highlightId}
          />
          <ProjectsSection
            idS={ProjectSection.HIDDEN}
            title="Hidden Projects"
            projects={hiddenProjects}
            onToggleHidden={handleToggleHidden}
            onRestore={handleRestoreProject}
            highlightId={highlightId}
          />
          <ProjectsSection
            idS={ProjectSection.ARCHIVED}
            title="Archived Projects"
            projects={archivedProjects}
            onToggleHidden={handleToggleHidden}
            onRestore={handleRestoreProject}
            highlightId={highlightId}
          />
        </div>
      )}

      {/* Projects Sections for normal users */}
      {user?.role !== 'admin' && (
        <ProjectsSection
          idS="your_projects"
          title="Your Projects"
          projects={projects.filter(
            p => p.leaderId === user.id || p.members?.includes(user.id)
          )}
          onToggleHidden={handleToggleHidden}
          onRestore={handleRestoreProject}
          highlightId={highlightId}
        />
      )}
    </div>
  );
};

// ---- StatCard Component ----
const StatCard = ({ title, count, color, completed }: any) => (
  <div className={`bg-white rounded-lg shadow p-4 border-l-4 border-${color}-500`}>
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <p className={`text-3xl font-bold text-${color}-600`}>{count}</p>
    {completed != null && (
      <p className="text-sm text-gray-600 mt-2">Completed: {completed}</p>
    )}
  </div>
);

// ---- ProjectsSection Component ----
const ProjectsSection = ({ idS, title, projects, onToggleHidden, onRestore, highlightId }: any) => (
  <motion.div
    id={idS}
    className="rounded-lg shadow p-4"
    animate={{
      backgroundColor: highlightId === idS ? "#fef3c7" : "#ffffff", // Highlight yellow
      border: highlightId === idS ? "2px solid #f59e0b" : "2px solid transparent",
    }}
    transition={{ duration: 0.3 }}
  >
    <h2 className="text-xl font-semibold mb-4">
      {title} ({projects.length})
    </h2>
    <ul className="space-y-3">
      {projects.map((project: any) => (
        <li
          key={project.id}
          className={`flex justify-between items-center p-3 border rounded hover:bg-gray-50 ${project.hidden ? 'bg-gray-100 opacity-80' : ''
            }`}
        >
          <div>
            <div className={`font-semibold ${project.hidden ? 'line-through text-gray-400' : ''}`}>
              {project.name}
            </div>
            <div className="text-sm text-gray-600 line-clamp-1">{project.description}</div>
          </div>
          <div className="flex gap-2">
            {project.hidden && (
              <button
                className="px-2 py-1 bg-green-500 text-white rounded"
                onClick={() => onToggleHidden(project)}
              >
                Unhide
              </button>
            )}
            {!project.hidden && project.status === 'active' && (
              <button
                className="px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => onToggleHidden(project)}
              >
                Hide
              </button>
            )}
            {['completed', 'archived'].includes(project.status) && (
              <button
                className="px-2 py-1 bg-blue-500 text-white rounded"
                onClick={() => onRestore(project)}
              >
                Restore
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  </motion.div>
);

export default Dashboard;
