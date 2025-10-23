import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getData, postData } from "../api/api";


const sleep = (ms) => new Promise(res => setTimeout(res, ms));


// helper آمن لقراءة اليوزر من localStorage
const readLocalUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ✅ جلب كل المستخدمين
export const fetchUsers = createAsyncThunk("user/fetchAll", async () => {
  const users = await getData("users");
  return users || [];
});

// ✅ تسجيل مستخدم جديد
export const registerUser = createAsyncThunk(
  "user/register",
  async (newUser, { rejectWithValue }) => {
    try {
      const created = await postData("users", newUser);
      return created;
    } catch (e) {
      return rejectWithValue("Registration failed");
    }
  }
);

// ✅ تسجيل الدخول
export const loginUser = createAsyncThunk(
  "user/login",
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      const users = (await getData("users")) || [];
      const existingUser = users.find(
        (u) =>
          (u.email?.toLowerCase() === identifier.toLowerCase() ||
            u.name?.toLowerCase() === identifier.toLowerCase()) &&
          u.password === password
      );

      if (!existingUser) {
        return rejectWithValue("Invalid credentials");
      }

      sleep(1000)
      localStorage.setItem("user", JSON.stringify(existingUser));
      return existingUser;
    } catch (err) {
      return rejectWithValue("Login failed");
    }
  }
);

// ✅ تسجيل الخروج (محلي)
export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
        sleep(1000)
      localStorage.removeItem("user");
      return null;
    } catch {
      return rejectWithValue("Logout failed");
    }
  }
);

const usersSlice = createSlice({
  name: "user",
  initialState: {
    user: readLocalUser(),
    role: readLocalUser()?.role || "guest",

    usersList: [],

    // توحيد أسماء حالات التحميل/الأخطاء
    usersLoading: false,    // fetch/register
    usersError: null,

    authLoading: false,     // login
    authError: null,

    logoutLoading: false,   // logout
    logoutError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 🟢 Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.usersList = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload || action.error?.message || "Failed to fetch users";
      })

      // 🟢 Register user
      .addCase(registerUser.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.usersList.push(action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload || action.error?.message || "Registration failed";
      })

      // 🟢 Login user
      .addCase(loginUser.pending, (state) => {
        state.authLoading = true;
        state.authError = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.authLoading = false;
        state.user = action.payload;
        state.role = action.payload?.role || "user";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.authLoading = false;
        state.authError = action.payload || action.error?.message || "Login failed";
      })

      // 🟢 Logout user
      .addCase(logoutUser.pending, (state) => {
        state.logoutLoading = true;
        state.logoutError = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.logoutLoading = false;
        state.user = null;
        state.role = "guest";
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.logoutLoading = false;
        state.logoutError = action.payload || action.error?.message || "Logout failed";
      });
  },
});

export default usersSlice.reducer;
