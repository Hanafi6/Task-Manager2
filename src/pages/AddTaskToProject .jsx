// src/components/AddTaskToProject.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTaskToProject } from "../slices/projectsSlice";

const AddTaskToProject = ({ projectId }) => {
  const dispatch = useDispatch();
  const users = useSelector((s) => s.users?.list || []);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    dueDate: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Task title required");

    const newTask = {
      ...form,
      id: Date.now(),
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addTaskToProject({ projectId, task: newTask }));
    setForm({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-3">
      <h3 className="text-lg font-semibold">Add Task</h3>

      <input
        type="text"
        name="title"
        placeholder="Task title..."
        className="border p-2 rounded w-full"
        value={form.title}
        onChange={handleChange}
      />

      <textarea
        name="description"
        placeholder="Task description..."
        className="border p-2 rounded w-full"
        value={form.description}
        onChange={handleChange}
      />

      <div className="flex gap-3">
        <select
          name="assignedTo"
          className="border p-2 rounded flex-1"
          value={form.assignedTo}
          onChange={handleChange}
        >
          <option value="">Assign to...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <select
          name="priority"
          className="border p-2 rounded flex-1"
          value={form.priority}
          onChange={handleChange}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <input
        type="date"
        name="dueDate"
        className="border p-2 rounded w-full"
        value={form.dueDate}
        onChange={handleChange}
      />

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Add Task
      </button>
    </form>
  );
};

export default AddTaskToProject;
    