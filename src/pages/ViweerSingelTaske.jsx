// pages/ViweerSingelTaske.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  makeSelectTaskDetails,
  formatDuration,
  computeTaskTimeMeta,
  makeSelectProjectById,
} from "../store/selectors";

function ViweerSingelTaske() {
  const { id } = useParams();
  const role = useSelector((s) => s.auth?.role || "user");

  // 📦 هات بيانات المهمة
  const selectTask = React.useMemo(() => makeSelectTaskDetails(id), [id]);
  const task = useSelector(selectTask);

  if (!task)
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="p-4 rounded border border-dashed text-gray-600">
          ❌ Task not found
        </div>
      </div>
    );

  const project = useSelector(
    task?.projectId ? makeSelectProjectById(task.projectId) : () => null
  );

  // ⏱️ حسِب الوقت المتبقي وراقبه كل ثانية
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const data = computeTaskTimeMeta(task) || {};
  const dueDate = new Date(task.dueDate);
  const msLeft = dueDate - now;
  const remaining = msLeft > 0 ? formatDuration(msLeft) : "Overdue";
  const isOverdue = msLeft < 0;

  const statusColor = chipColorByStatus(task.status);
  const priorityColor = chipColorByPriority(task.priority);

  // 🎨 لون التايمر حسب الحالة
  const timerColor = isOverdue
    ? "text-red-600"
    : msLeft < 6 * 60 * 60 * 1000
      ? "text-green-600"
      : "text-sky-600";

  const disabled = Boolean(task.status === "done" || isOverdue);

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500">
        <Link to="/projects" className="hover:underline">
          Projects
        </Link>
        {project?.id && (
          <>
            <span className="mx-1">/</span>
            <Link
              to={`/projects/${project.id}`}
              className="hover:underline font-medium"
            >
              {project.name || "Unnamed Project"}
            </Link>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-gray-800 font-medium">Task #{task.id}</span>
      </nav>

      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {task.title || "Untitled Task"}
          </h1>
          {task.description && (
            <p className="text-gray-600 mt-1">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Chip label={task.status || "unknown"} className={statusColor} />
            <Chip
              label={task.priority || "no-priority"}
              className={priorityColor}
            />
            {isOverdue && (
              <Chip label="Overdue" className="bg-red-100 text-red-700" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded bg-sky-600 text-white disabled:opacity-50"
            disabled={disabled}
            title={
              disabled
                ? "Action disabled: task done/blocked/overdue"
                : "Start / Open"
            }
          >
            Start / Open
          </button>
          {role === "admin" && (
            <button className="px-3 py-1.5 rounded bg-gray-100">
              Admin Action
            </button>
          )}
        </div>
      </header>

      {/* Meta */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Assignee">
          <div className="text-gray-800">
            {task.user?.name || "Unassigned"}
            {task.user?.email && (
              <div className="text-sm text-gray-500">{task.user.email}</div>
            )}
          </div>
        </Card>

        <Card title="Project">
          {project?.id ? (
            <div className="text-gray-800">
              <Link
                to={`/projects/${project.id}`}
                className="hover:underline font-medium"
              >
                {project.name || "Unnamed Project"}
              </Link>
              <div className="text-sm text-gray-500">
                Status: {project.status || "—"}
              </div>
              {Array.isArray(project.members) && (
                <div className="text-sm text-gray-500">
                  Members: {project.members.length}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">No Project</div>
          )}
        </Card>

        {/* 🕒 Timing + Timer */}
        <Card title="Timing">
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              Due date:{" "}
              <strong>
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleString()
                  : "—"}
              </strong>
            </li>
            <li>
              Remaining:{" "}
              <strong className={`font-semibold ${timerColor}`}>
                {remaining}
              </strong>
            </li>
            <li>
              Overdue:{" "}
              <strong className={isOverdue ? "text-red-600" : ""}>
                {isOverdue ? "Yes" : "No"}
              </strong>
            </li>
          </ul>

          {/* عداد ديناميكي */}
          <div className={`mt-4 text-lg font-bold ${timerColor}`}>
            {isOverdue
              ? "⏰ Task overdue!"
              : `⏳ ${formatDuration(msLeft)} remaining`}
          </div>
        </Card>

        <Card title="Audit">
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              Created at:{" "}
              <strong>
                {task.createdAt
                  ? new Date(task.createdAt).toLocaleString()
                  : "—"}
              </strong>
            </li>
            <li>
              Updated at:{" "}
              <strong>
                {task.updatedAt
                  ? new Date(task.updatedAt).toLocaleString()
                  : "—"}
              </strong>
            </li>
            <li>
              Created by:{" "}
              <strong>{task.createdByName || "غير مذكور"}</strong>
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}

/* UI helpers */
function Card({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      {children}
    </div>
  );
}

function Chip({ label, className = "" }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function chipColorByStatus(status = "") {
  const s = status.toLowerCase();
  if (s === "done") return "bg-green-100 text-green-700";
  if (s === "blocked") return "bg-amber-100 text-amber-800";
  if (s === "in progress") return "bg-sky-100 text-sky-700";
  if (s === "todo") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-700";
}

function chipColorByPriority(priority = "") {
  const p = priority.toLowerCase();
  if (p === "urgent") return "bg-red-100 text-red-700";
  if (p === "high") return "bg-orange-100 text-orange-700";
  if (p === "medium") return "bg-blue-100 text-blue-700";
  if (p === "low") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-700";
}

export default ViweerSingelTaske;
