// pages/TasksPage.tsx
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import TaskCard from "../components/TaskeCard";
import { makeSelectTasks } from "../store/selectors";

const TasksPage: React.FC = () => {
  const { user, role } = useSelector((s: any) => s.auth);

  // 🔥 استخدم Selector واحد فقط بيرجع:
  // list + grouped + statuses
  const selectTasks = useMemo(
    () => makeSelectTasks({ userId: user.id, role }),
    [user.id, role]
  );

  const { list, grouped, statuses } = useSelector((state) =>
    selectTasks(state)
  );

  // console.log(list,grouped,statuses)

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Tasks Overview</h1>

      {/* 🔥 توليد سكيشنز حسب كل Status */}
      {statuses.map((status) => (
        <section
          key={status}
          className="rounded-2xl shadow p-4 border bg-gray-50"
        >
          <h2 className="text-xl font-semibold mb-4 capitalize">
            {status.replace("_", " ")}
          </h2>

          {grouped[status].length > 0 ? (
            <div className="space-y-3">
              {grouped[status].map((task: any) => (
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
            <p className="text-gray-500 italic">No tasks in this section.</p>
          )}
        </section>
      ))}
    </div>
  );
};

export default TasksPage;
