// store/projectsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getData, postData } from "../api/api";

// helper: تطبيع الخطأ
const normalizeError = (err) => {
  if (typeof err === "string") return err;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  return "Something went wrong";
};

// 🟦 Fetch
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
// نستقبل كل الفورم من الكمبوننت ونحط ديفولتس من عندنا لو ناقص
export const addProject = createAsyncThunk(
  "projects/add",
  async (form, { rejectWithValue }) => {
    try {
      const payload = {
        // لازم اسم + وصف على الأقل
        name: form.name?.trim(),
        description: form.description?.trim() || "",
        // لو مفيش leaderId نخليها null ونطلع وارننج في UI (لكن السيرفر ممكن يسمح)
        leaderId: form.leaderId ? Number(form.leaderId) : null,
        // ديفولتس
        status: form.status || "active",
        members: Array.isArray(form.members) ? form.members.map(Number) : [],
        // لو مش جاي من الفورم، نولّد دلوقتي
        createdAt: form.createdAt || new Date().toISOString(),
        // المشاريع الجديدة غالبًا بدون مهام
        tasks: Array.isArray(form.tasks) ? form.tasks : [],
      };

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

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    list: [],          // projects فقط
    tasks: [],         // جميع المهام (flat) + projectId
    loading: false,    // لطلبات عامة (fetch)
    loadingSome: false,// لطلبات جزئية (add/update)
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    // (اختياري) إضافة مهمة لمشروع محليًا
    addTaskToProjectLocal(state, action) {
      const { projectId, task } = action.payload;
      const proj = state.list.find((p) => Number(p.id) === Number(projectId));
      if (proj) {
        if (!Array.isArray(proj.tasks)) proj.tasks = [];
        proj.tasks.push(task);
      }
      state.tasks.push({ ...task, projectId });
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
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

      // add
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
        state.loadingSome = false; // ✅ المهم تصلّح هنا
        state.error =
          action.payload || action.error?.message || "Failed to add project";
      });
  },
});

export const { clearError, addTaskToProjectLocal } = projectsSlice.actions;
export default projectsSlice.reducer;
