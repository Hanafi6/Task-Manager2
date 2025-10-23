// pages/TasksPage.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import TaskCard from '../components/TaskeCard'; // ✅ استبدل TaskItem

const TasksPage: React.FC = () => {
  const tasks = useSelector((state: any) => state.projects.tasks);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <div className="space-y-4">
        {tasks?.map((task: any) => (
          <TaskCard
            key={task.id}
            task={task}
            compact={false}        // عرض كامل مش مضغوط
            showAssignee={true}    // يوضح المسؤول
            showProject={true}     // يوضح المشروع لو حابب
            clickable              // يخلي الكارد يفتح صفحة التفاصيل /tasks/:id
          />
        ))}
      </div>
    </div>
  );
};

export default TasksPage;
