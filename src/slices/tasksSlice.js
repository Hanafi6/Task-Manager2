import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getData, postData, updateData } from "../api/api";

// ✅ Fetch all tasks with their related user & project data
export const fetchTasks = createAsyncThunk("tasks/fetch", async (_, thunkAPI) => {
  const [tasks, users, projects] = await Promise.all([
    getData("tasks"),
    getData("users"),
    getData("projects"),
  ]);

  // ✅ ربط كل تاسك بمعلومات اليوزر والبروجيكت
  const tasksWithRelations = tasks.map((task) => ({
    ...task,
    user: users.find((u) => u.id === task.assignedTo) || { name: "Unassigned" },
    project: projects.find((p) => p.id === task.projectId) || { name: "No Project" },
  }));

  return tasksWithRelations;
});

// ✅ Add a new task
export const addTask = createAsyncThunk(
  "tasks/add",
  async ({ title, projectId, assignedTo }, thunkAPI) => {
    const newTask = await postData("tasks", {
      title,
      projectId,
      assignedTo,
      status: "Pending",
    });

    // ✅ بعد الإضافة، نربطها بالمستخدم والبروجيكت من الستيت الحالي
    const state = thunkAPI.getState();
    const user = state.users.list?.find((u) => u.id === assignedTo);
    const project = state.projects.list?.find((p) => p.id === projectId);

    return {
      ...newTask,
      user: user || { name: "Unassigned" },
      project: project || { name: "No Project" },
    };
  }
);

// ✅ Update task status
export const updateTaskStatus = createAsyncThunk(
  "tasks/updateStatus",
  async ({ id, status }, thunkAPI) => {
    const updated = await updateData("tasks", id, { status });

    // بعد التحديث بنرجع نفس التاسك بالمعلومات القديمة
    const state = thunkAPI.getState();
    const existing = state.tasks.list.find((t) => t.id === id);

    return {
      ...existing,
      ...updated,
    };
  }
);

// ✅ Slice
const tasksSlice = createSlice({
  name: "tasks",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.list.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      });
  },
});

export default tasksSlice.reducer;
