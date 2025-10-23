// pages/ViewProject.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import ProjectCard from "../components/ProjectCard";

export default function ViewProject() {
  const { id } = useParams();
  const pid = Number(id);
  const { list: projects = [],loading} = useSelector((s) => s.projects || { list: [] });
  const user = useSelector((s) => s.auth?.user);
  const role = user?.role || "user";

  const project = projects.find((p) => Number(p.id) === pid);
  if (!project) return <div className="p-6">❌ Project not found</div>;
  if (loading) return <div className="p-6">Gitting</div>;

  return (
    <div className="container mx-auto px-6 py-8">
      <ul className="space-y-3">
        <ProjectCard
          project={project}
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
