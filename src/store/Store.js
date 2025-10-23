import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "../slices/usersSlice";
import projectsReducer from "../slices/projectsSlice";
import Auth from '../slices/AuthSlice';

export const store = configureStore({
  reducer: {
    users: usersReducer,
    projects: projectsReducer,
    auth: Auth, // تأكد من استيراد الـ AuthSlice بشكل صحيح
  },
});
