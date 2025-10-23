// pages/ProjectsPage.jsx
import { useSelector } from 'react-redux';
import ProjectCard from '../components/ProjectCard';

const ProjectsPage  = () => {
  const { list, loading } = useSelector((state) => state.projects);

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="w-full mx-auto p-4">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Projects</h1>
      <ul className="grid grid-cols-1  sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-4">
        {list.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </ul>
    </div>
  );
};

export default ProjectsPage;
