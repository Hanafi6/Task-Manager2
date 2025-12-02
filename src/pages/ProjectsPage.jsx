// pages/ProjectsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ProjectCard from '../components/ProjectCard';
import { makeSelectALLProjectsForUser } from '../store/selectors';

const ProjectsPage = () => {
  const { list, loading } = useSelector((state) => state.projects);
  const { user, role } = useSelector((state) => state.auth);


  // اسم أوضح للحالة
  const [projectsToShow, setProjectsToShow] = useState([]);

  // memoize the selector factory so we don't recreate it every render
  const selectAllProjectsForUser = useMemo(
    () => makeSelectALLProjectsForUser(user?.id),
    [user?.id]
  );

  // useSelector with the memoized selector
  const scProj = useSelector((state) => selectAllProjectsForUser(state));

  // effect: اختر القائمة المناسبة بناءً على الدور
  useEffect(() => {
    if (role === 'user') {
      setProjectsToShow(scProj ?? []); // projects for this user
    } else {
      setProjectsToShow(list ?? []); // admin/other roles see full list
    }
  }, [role, scProj, list]); // جميع الاعتماديات الضرورية

  // console.log(scProj)
  if (loading) return <p className="p-4">Loading...</p>;


  return (
    <div className="w-full mx-auto p-4">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Projects</h1>

      <ul className="grid grid-cols-1 gap-4">
        {projectsToShow.map((project) => (
          <ProjectCard key={project.id}
            project={project}
            tasksForProject={[]}
            mode={role === "admin" ? "all" : "mine"}
            currentUserId={user.id}
            collapsible={true}
            defaultOpen={false}
            showStats
            showMeta={true}
            mineTaskes={true}
            clickableTitle={project.hidden ? false : true}
            hidden={project.hidden}
          />
        ))}
      </ul>
    </div>
  );
};

export default ProjectsPage;
