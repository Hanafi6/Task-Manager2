// components/ProjectCard.jsx
import React from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { CircleArrowOutDownLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import TaskCard from "../components/TaskeCard";

// Helpers
const PRIORITY_ORDER = ["urgent", "high", "medium", "low"];
const arr=[]
const lower = (v) => (v || "").toString().toLowerCase();
const prioRank = (p) => {
  const i = PRIORITY_ORDER.indexOf(lower(p));
  
  return i === -1 ? PRIORITY_ORDER.length : i;
};

const isOverdue = (t) => t?.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date();

const getTopPriorityInProject = (tasks = []) => {
  if (!tasks.length) return null;
  return tasks
    .map((t) => lower(t.priority))
    .sort((a, b) => prioRank(a) - prioRank(b))[0] || null;
};

const priorityChipCls = (p) => {
  const pr = lower(p);
  if (pr === "urgent") return "bg-red-100 text-red-700";
  if (pr === "high")   return "bg-orange-100 text-orange-700";
  if (pr === "medium") return "bg-amber-100 text-amber-800";
  if (pr === "low")    return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-700";
};

const sortTasksByPriority = (a, b) => {
  const pa = prioRank(a.priority), pb = prioRank(b.priority);
  if (pa !== pb) return pa - pb;
  const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
  const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
  return da - db;
};

function projectBadge(project, tasks) {
  const allDone = tasks.length > 0 && tasks.every((t) => t.status === "done");
  const hasUrgentOrHigh = tasks.some((t) => ["urgent", "high"].includes(lower(t.priority)));
  const hasOverdue = tasks.some((t) => isOverdue(t));

  if (allDone || ["completed", "done"].includes(lower(project.status))) {
    return { ring: "ring-green-400", bg: "bg-green-50", badge: "Completed", badgeCls: "bg-green-100 text-green-700" };
  }
  if (hasUrgentOrHigh || hasOverdue) {
    return { ring: "ring-red-400", bg: "bg-red-50", badge: hasOverdue ? "Overdue" : "Important", badgeCls: "bg-red-100 text-red-700" };
  }
  if (lower(project.status) === "active") {
    return { ring: "ring-sky-400", bg: "bg-sky-50", badge: "Active", badgeCls: "bg-sky-100 text-sky-700" };
  }
  return { ring: "ring-gray-300", bg: "bg-gray-50", badge: "Idle", badgeCls: "bg-gray-100 text-gray-700" };
}

export default function ProjectCard({
  project,
  tasksForProject,
  mode = "all",
  currentUserId = null,
  collapsible = true,
  defaultOpen = false,
  showStats = true,
  showMeta = true,
  clickableTitle = true,
}) {
  const navigate = useNavigate();
  const { role } = useSelector((s) => s.auth || {});
  const users = useSelector((s) => s.auth?.usersList || []);
  const { tasks: allFlatTasks = [] } = useSelector((s) => s.projects || { tasks: [] });

  const tasks = Array.isArray(tasksForProject)
    ? tasksForProject
    : allFlatTasks.filter((t) => Number(t.projectId) === Number(project.id));

  const visibleTasks =
    mode === "mine" && currentUserId != null
      ? tasks.filter((t) => Number(t.assignedTo) === Number(currentUserId))
      : tasks;

  const visibleTasksSorted = [...visibleTasks].sort(sortTasksByPriority);
  const pc = projectBadge(project, tasks);

  const stats = showStats
    ? {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === "todo").length,
        inProgress: tasks.filter((t) => t.status === "in progress").length,
        blocked: tasks.filter((t) => t.status === "blocked").length,
        done: tasks.filter((t) => t.status === "done").length,
      }
    : null;

  const leader = users.find((u) => Number(u.id) === Number(project.leaderId)) || null;
  const topPrio = getTopPriorityInProject(tasks);


  const [open, setOpen] = React.useState(defaultOpen);

  const checkStatus = (status) => {
    const map = {
      active:    { label: "Archive", action: "archive", cls: "bg-amber-100 text-amber-800" },
      completed: { label: "Unblock", action: "unblock", cls: "bg-green-100 text-green-700" },
      block:     { label: "Block",   action: "block",   cls: "bg-red-100 text-red-700" },
    };
    return map[status?.toLowerCase()] || { label: "Unknown", action: "none", cls: "bg-gray-100 text-gray-600" };
  };
  const btn = checkStatus(project.status);

  // =============== Header Right (Responsive) ===============
  const InfoChips = (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {showMeta && (
        <>
          {project.leaderId != null && (
            <Link
              to={`/user/${project.leaderId}`}
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition"
              title={leader ? leader.name : `#${project.leaderId}`}
            >
              Leader: {leader ? leader.name : `#${project.leaderId}`}
            </Link>
          )}
          {Array.isArray(project.members) && (
            <span className="text-xs px-2 py-1 rounded bg-gray-100">
              Members: {project.members.length}
            </span>
          )}
          {project.createdAt && (
            <span className="text-xs px-2 py-1 rounded bg-gray-100">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded ${priorityChipCls(topPrio)}`}>
            Top prio: {topPrio || "—"}
          </span>
        </>
      )}

      {role === "admin" && (
        <button
          type="button"
          className={`text-xs px-2.5 py-1 rounded ${btn.cls}`}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: dispatch action حسب الـ btn.action
          }}
          title="Admin action"
        >
          {btn.label}
        </button>
      )}
    </div>
  );

  const Content = (
    <div className="px-4 pb-4 pt-3 bg-white">
      <h4 className="font-semibold mb-2">
        {mode === "mine" ? `My Tasks (${visibleTasks.length})` : `Tasks (${tasks.length})`}
      </h4>

      {visibleTasksSorted.length ? (
        <ul className="space-y-2">
          {visibleTasksSorted.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              showAssignee={mode === "all"}
              showProject={false}
              clickable
            />
          ))}
        </ul>
      ) : (
        <div className="p-3 rounded border border-dashed text-gray-600">
          {mode === "mine" ? "مفيش مهام متعيّنة ليك في المشروع ده." : "مفيش مهام لهذا المشروع."}
        </div>
      )}
    </div>
  );

  return (
    <li className={`rounded-lg border border-gray-200 ring-2 ${pc.ring} overflow-hidden`}>
      {/* Header: عمودي على الموبايل / أفقي على الشاشات الكبيرة */}
      <div className={`w-full px-4 py-3 ${pc.bg}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left: Title + badges + desc */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              {clickableTitle ? (
                <button
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="text-left text-lg md:text-xl font-semibold hover:underline truncate"
                >
                  {project.name}
                </button>
              ) : (
                <div className="text-left text-lg md:text-xl font-semibold truncate">{project.name}</div>
              )}
              <span className={`text-xs px-2 py-0.5 rounded ${pc.badgeCls}`}>{pc.badge}</span>
              {mode === "mine" && (
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  My tasks: {visibleTasks.length}
                </span>
              )}
            </div>
            <div className="text-gray-600 text-sm md:text-base mt-0.5 line-clamp-2 md:line-clamp-1">
              {project.description}
            </div>
          </div>

          {/* Right: Chips + Admin btn (تتحرك تحت العنوان على الموبايل) */}
          {InfoChips}

          {/* Expand/Collapse */}
          {collapsible && (
            <motion.button
              onClick={() => setOpen((v) => !v)}
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-gray-600 self-start md:self-center"
              title="Expand / Collapse"
            >
              <CircleArrowOutDownLeft className={`${open ? "text-blue-500" : "text-gray-400"}`} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Content */}
      {collapsible ? (
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {Content}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        Content
      )}
    </li>
  );
}
