// src/store/projectsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getData, postData, updateData } from "../api/api";
import { useNavigate } from "react-router-dom";

// 🧩 helper: تطبيع الأخطاء
const normalizeError = (err) => {
  if (typeof err === "string") return err;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  return "Something went wrong";
};

// 🟦 Fetch Projects
export const fetchProjects = createAsyncThunk(
  "projects/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const raw = (await getData("projects")) || [];
      const projects = raw.map(({ tasks = [], ...p }) => p);
      const tasks = raw.flatMap((p) =>
        (p.tasks || []).map((t) => ({ ...t, projectId: p.id }))
      );
      return { projects, tasks };
    } catch (e) {
      return rejectWithValue(normalizeError(e));
    }
  }
);

// 🟦 Add Project
export const addProject = createAsyncThunk(
  "projects/add",
  async (payload, { rejectWithValue }) => {
    try {
      // const payload = {
      //   name: form.name?.trim(),
      //   description: form.description?.trim() || "",
      //   leaderId: form.leaderId ? Number(form.leaderId) : null,
      //   status: form.status || "active",
      //   members: Array.isArray(form.members) ? form.members.map(Number) : [],
      //   createdAt: form.createdAt || new Date().toISOString(),
      //   tasks: Array.isArray(form.tasks) ? form.tasks : [],
      // };

      if (!payload.name) {
        return rejectWithValue("Project name is required");
      }

      const created = await postData("projects", payload);
      if (!created || !created.id) {
        return rejectWithValue("Server did not return created project");
      }
      return created;
    } catch (e) {
      return rejectWithValue(normalizeError(e));
    }
  }
);

// 🟦 Add Task (Thunk)
export const addTask = createAsyncThunk(
  "projects/addTask",
  async ({ projectId, task }, { rejectWithValue }) => {
    try {
      if (!projectId || !task) throw new Error("ProjectId and Task required");

      // 1️⃣ احضر المشروع أولاً
      const project = await getData(`projects/${projectId}`);
      if (!project) throw new Error("Project not found");

      // 2️⃣ جهز التاسك الجديدة
      const newTask = {
        ...task,
        id: task.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3️⃣ حدّث المشروع نفسه (json-server لازم PUT كامل)
      const updatedProject = {
        ...project,
        tasks: [...(project.tasks || []), newTask],
      };
      // updateData

      const saved = await updateData('projects', projectId, updatedProject);

      if (!saved.ok) throw new Error("Failed to add task to project");
      const data = await saved.json();
      return { projectId, task: newTask, updatedProject: data };
    } catch (err) {
      return rejectWithValue(
        err.message || "Failed to add task. Please try again."
      );
    }
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    list: [], // المشاريع
    tasks: [], // جميع المهام
    loading: false,
    loadingSome: false,
    error: null,
    selectProject: null,
  },
  reducers: {
    setSelectProject(state, action) {
      state.selectProject = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    addTaskToProjectLocal(state, action) {
      const { projectId, task } = action.payload;
      const proj = state.list.find((p) => String(p.id) === String(projectId));
      if (proj) {
        if (!Array.isArray(proj.tasks)) proj.tasks = [];
        proj.tasks.push(task);
      }
      state.tasks.push({ ...task, projectId });
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Fetch
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.projects;
        state.tasks = action.payload.tasks;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || "Failed to fetch projects";
      })

      // 🔹 Add Project
      .addCase(addProject.pending, (state) => {
        state.loadingSome = true;
        state.error = null;
      })
      .addCase(addProject.fulfilled, (state, action) => {
        state.loadingSome = false;
        const { tasks, ...proj } = action.payload;
        state.list.push(proj);
        if (Array.isArray(tasks) && tasks.length) {
          const flat = tasks.map((t) => ({ ...t, projectId: proj.id }));
          state.tasks.push(...flat);
        }
      })
      .addCase(addProject.rejected, (state, action) => {
        state.loadingSome = false;
        state.error =
          action.payload || action.error?.message || "Failed to add project";
      })

      // 🔹 Add Task
      .addCase(addTask.pending, (state) => {
        state.loadingSome = true;
        state.error = null;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.loadingSome = false;
        const { projectId, task, updatedProject } = action.payload;
        // useNavigate(`/projects/${projectId}`)

        // أضف التاسك للـ flat list
        state.tasks.push({ ...task, projectId });

        // حدث المشروع نفسه
        const projIndex = state.list.findIndex(
          (p) => String(p.id) == String(projectId)
        );
        if (projIndex !== -1) {
          state.list[projIndex] = {
            ...updatedProject,
            tasks: updatedProject.tasks || [],
          };
        }
      })
      .addCase(addTask.rejected, (state, action) => {
        state.loadingSome = false;
        state.error =
          action.payload ||
          action.error?.message ||
          "Failed to add task to project";
      });
  },
});

export const { setSelectProject, clearError, addTaskToProjectLocal } =
  projectsSlice.actions;
export default projectsSlice.reducer;
