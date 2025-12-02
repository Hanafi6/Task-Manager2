// src/components/AddTaskToProject.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTask, addTaskToProjectLocal, setSelectProject } from "../slices/projectsSlice";
import { selectProjects, selectSelectedProject, selectUsers } from "../store/selectors";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

const AddTaskToProject = () => {
  const navigate = useNavigate();
  const { projectId } = useParams(); // يمكن يكون undefined
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const selectProject = useSelector(state => state.projects.selectProject);
  const users = useSelector(selectUsers);
  const { user } = useSelector(state => state.auth);

  const [warning, setWarnning] = useState("");
  const [IsWarning, setIsWarning] = useState(false);

  const [members, setMembers] = useState([]);

  useEffect(_ => {
    if (warning) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsWarning(true);
      const timer = setTimeout(() => {
        setIsWarning(false);
        setWarnning("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warning]);



  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    startAt: "",
    dueDate: "",
    estimateHours: "",
    requirements: "",
    acceptanceCriteria: "",
    labels: "",
  });

  useEffect(_ => {
    if (projectId) {
      setForm(prev => ({ ...prev, projectId: projectId }));
      dispatch(setSelectProject(projects.find(c => c.id == projectId)));
      setIsWarning(false);
    } else {
      setIsWarning(true);
      setWarnning("Please select a project to add task to.");
    }
  }, [projectId, projects, dispatch]);

  useEffect(() => {
    if (form.startAt && form.dueDate) {
      const start = new Date(form.startAt);
      const end = new Date(form.dueDate);

      if (end > start) {
        const diffMs = end - start;
        const hours = Math.round(diffMs / (1000 * 60 * 60));
        setForm(prev => ({ ...prev, estimateHours: hours }));
      } else {
        setForm(prev => ({ ...prev, estimateHours: "" }));
        setWarnning("Due date must be after the start date!");
      }
    }
  }, [form.startAt, form.dueDate]);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  useEffect(_ => {
    if (selectProject) {
      const memberIds = selectProject.members || [];
      setMembers(users.filter(u => memberIds.includes(Number(u.id) || u.id)));

    } else {
      setMembers([]);
      setWarnning("Please select a project to see its members.");
    }
  }, [selectProject])


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.projectId)
      return setWarnning("please fill all required fields");

    const newTask = {
      id: Date.now().toString(),
      title: form.title,
      description: form.description,
      status: "active",
      priority: form.priority,
      assignedTo: form.assignedTo || null,
      createdBy: 1,
      requirements: form.requirements
        ? form.requirements.split(",").map((s) => s.trim())
        : [],
      acceptanceCriteria: form.acceptanceCriteria
        ? form.acceptanceCriteria.split(",").map((s) => s.trim())
        : [],
      labels: form.labels ? form.labels.split(",").map((s) => s.trim()) : [],
      blockerNote: null,
      endAt: null,
      startAt: form.startAt || null,
      dueDate: form.dueDate || null,
      estimateHours: Number(form.estimateHours) || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };



    dispatch(addTask({ projectId: form.projectId, task: newTask, createdBy: user.id }))
      .unwrap()
      .then((res) => {
        console.log(res)
        console.log(res)
        navigate(`/tasks/${res.task.id}`)
      })
      .catch((err) => {
        setIsWarning(true);
        setWarnning(err)
        // console.log(err)
        // setWarnning(err.message || "Failed to add task")
      });



    // navigate(`/projects/${form.projectId}`)

    // setForm({
    //   projectId: "",
    //   title: "",
    //   description: "",
    //   assignedTo: "",
    //   priority: "medium",
    //   startAt: "",
    //   dueDate: "",
    //   estimateHours: "",
    //   requirements: "",
    //   acceptanceCriteria: "",
    //   labels: "",
    // });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded text-[20px] shadow-md space-y-4 border border-gray-100 max-w-2xl mx-auto mt-6"
    >
      <div>
        <AnimatePresence>
          {IsWarning && (
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 260, damping: 15 }}
              className=" text-yellow-500 font-black absolute left-[calc(50%-200px)] top-30 w-[400px] bg-[#555] p-2 rounded mb-4 text-center ">
              {warning}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <h3 className="text-2xl font-bold text-gray-700 mb-3">➕ Add New Task</h3>

      {/* Project Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Select Project
        </label>
        <select
          name="projectId"
          value={form.projectId}
          onChange={e => {
            handleChange(e)
            dispatch(setSelectProject(projects.find(c => {
              return c.id == e.target.value
            })));
          }}
          className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">-- Choose Project --</option>
          {projects.map((project) => {
            if (project?.hidden) return;
            return (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            )
          })}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Task Title
        </label>
        <input
          type="text"
          name="title"
          placeholder="Task title..."
          className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.title}
          onChange={handleChange}
          required
          autoFocus={projectId ? true : false}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Description
        </label>
        <textarea
          name="description"
          placeholder="Task description..."
          rows="3"
          className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.description}
          onChange={handleChange}
        />
      </div>

      {/* Assign + Priority */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Assign To
          </label>
          <select
            name="assignedTo"
            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.assignedTo}
            onChange={handleChange}
          >
            <option value="">-- Assign to --</option>
            {/* ///////////////////////////////// */}
            {members.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Priority
          </label>
          <select
            name="priority"
            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Start At
          </label>
          <input
            type="datetime-local"
            name="startAt"
            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.startAt}
            onChange={handleChange}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Due Date
          </label>
          <input
            type="datetime-local"
            name="dueDate"
            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.dueDate}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Estimate Hours */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Estimated Hours
        </label>
        <input
          type="number"
          name="estimateHours"
          placeholder="e.g. 4"
          className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.estimateHours}
          onChange={handleChange}
        />
      </div>

      {/* Requirements / Criteria / Labels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Requirements
          </label>
          <input
            type="text"
            name="requirements"
            placeholder="Comma-separated"
            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.requirements}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Acceptance Criteria
          </label>
          <input
            type="text"
            name="acceptanceCriteria"
            placeholder="Comma-separated"
            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.acceptanceCriteria}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Labels
          </label>
          <input
            type="text"
            name="labels"
            placeholder="marketing, dashboard"
            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.labels}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
      >
        + Add Task
      </button>
    </form>
  );
};

export default AddTaskToProject;
