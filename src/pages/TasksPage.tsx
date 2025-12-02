// pages/TasksPage.tsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import TaskCard from '../components/TaskeCard';
import { makeSelectTasksByUser } from '../store/selectors';

const TasksPage: React.FC = () => {
  const { user } = useSelector((s: any) => s.auth);




  // ✅ Selector للمهام النشطة فقط
  const selectActiveTasks = useMemo(
    () => makeSelectTasksByUser(user.id, { activeOnly: true }),
    [user.id]
  );

  const activeTasks = useSelector((state) => selectActiveTasks(state));

  // ✅ Selector لكل المهام (active + inactive)
  const selectAllTasks = useMemo(
    () => makeSelectTasksByUser(user.id, { activeOnly: false }),
    [user.id]
  );
  const allTasks = useSelector((state) => selectAllTasks(state));

  // ❌ المهام غير النشطة = كل المهام - النشطة
  const inactiveTasks = allTasks.filter(
    (task) => !activeTasks.some((a) => a.id == task.id)
  );


  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Tasks Overview</h1>

      {/* ✅ قسم المهام النشطة */}
      <section className="bg-green-50 rounded-2xl shadow p-4">
        <h2 className="text-xl font-semibold text-green-700 mb-4">
          🟢 Active Tasks
        </h2>
        {activeTasks.length > 0 ? (
          <div className="space-y-3">
            {activeTasks.map((task: any) => (
              <TaskCard
                key={task.id}
                task={task}
                compact={false}
                showAssignee={true}
                showProject={true}
                clickable
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No active tasks found.</p>
        )}
      </section>

      {/* 🔴 قسم المهام غير النشطة */}
      <section className="bg-red-50 rounded-2xl shadow p-4">
        <h2 className="text-xl font-semibold text-red-700 mb-4">
          🔴 Inactive Tasks
        </h2>
        {inactiveTasks.length > 0 ? (
          <div className="space-y-3">
            {inactiveTasks.map((task: any) => (
              <TaskCard
                key={task.id}
                task={task}
                compact={false}
                showAssignee={true}
                showProject={true}
                clickable
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No inactive tasks found.</p>
        )}
      </section>
    </div>
  );
};

export default TasksPage;
