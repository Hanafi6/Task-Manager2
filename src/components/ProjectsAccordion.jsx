// components/ProjectsAccordionUnified.jsx
import React from "react";
import { useSelector } from "react-redux";
import ProjectCard from "./ProjectCard"; // ✅ بدل TaskeCard/TaskCard
import { makeSelectTasksByProjectId, selectProjectById } from "../store/selectors";
// مفيش احتياج لـ framer-motion هنا لأن ProjectCard نفسه فيه expand/collapse

export default function ProjectsAccordionUnified({ mode = "auto" }) {
  const { list: projects = [], projectsLoading: loading } =
    useSelector((s) => s.projects || { list: [], projectsLoading: false });
  // const [OpenDatilsDelete, setOpenDiitailsDelete] = React.useState(false);




  const user = useSelector((s) => s.auth?.user);
  const uid = Number(user?.id);
  const role = user?.role || "user";

  // حسم المود تلقائيًا حسب الدور
  const resolvedMode = mode === "auto" ? (role === "admin" ? "all" : "mine") : mode;

  // const project = useSelector(selectProjectById(id));

  // const tasks = useSelector((s) => makeSelectTasksByProjectId(id)(s));

  // فلترة المشاريع لو mode = mine
  const filteredProjects =
    resolvedMode === "all"
      ? projects
      : projects.filter((p) => p.leaderId === uid || p.members?.includes(uid));

  if (loading) return <Skeleton />;

  return (
    <ul className="space-y-3">
      {filteredProjects.map((p) => (
        <ProjectCard
          mineTaskes={true} // فيه نركه هنا خد باللك
          tasksForProject={[]}
          key={p.id}
          project={p}
          mode={resolvedMode}
          currentUserId={uid}
          collapsible
          defaultOpen={false}
          showStats
          showMeta
          hidden={p.hidden ? true : false}
          clickableTitle={p?.hidden ? false : true}
        />
      ))}

    </ul>
  );
}

function Skeleton() {
  return (
    <ul className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <li key={i} className="rounded-lg border border-gray-200 p-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        </li>
      ))}
    </ul>
  );
}
