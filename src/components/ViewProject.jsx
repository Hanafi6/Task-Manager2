// pages/ViewProject.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import ProjectCard from "../components/ProjectCard";
import { makeSelectTasksByProjectId, selectProjectById } from "../store/selectors";

export default function ViewProject() {
  const { id } = useParams();
  const { list: projects = [], loading } = useSelector((s) => s.projects || { list: [] });
  const user = useSelector((s) => s.auth?.user);
  const role = user?.role || "user";

  // const project = projects.find((p) => p.id === id);
  const project = useSelector(selectProjectById(id));

  const tasks = useSelector((s) => makeSelectTasksByProjectId(id)(s));

  if (!project) return <div className="p-6">❌ Project not found</div>;
  if (loading) return <div className="p-6">Gitting</div>;

  return (
    <div className="container mx-auto px-6 py-8">
      <ul className="space-y-3">
        <ProjectCard
          project={project}
          tasksForProject={tasks}
          mode={role === "admin" ? "all" : "mine"}
          currentUserId={user?.id}
          collapsible={false}
          defaultOpen
          showStats
          showMeta
          clickableTitle={false}
        />

      </ul>
    </div>
  );
}
