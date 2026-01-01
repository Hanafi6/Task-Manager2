import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getData, postData, deleteData } from "../api/api";

export const fetchUsers = createAsyncThunk("users/fetch", async () => {
  return await getData("users");
});

export const addUser = createAsyncThunk("users/add", async (user) => {
  return await postData("users", user);
});

export const deleteUser = createAsyncThunk("users/delete", async (id) => {
  await deleteData("users", id);
  return id;
});

const usersSlice = createSlice({
  name: "users",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u.id !== action.payload);
      });
  },
});

export default usersSlice.reducer;
