import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "../slices/usersSlice";
import projectsReducer from "../slices/projectsSlice";
import Auth from '../slices/AuthSlice';
import notificationsReducer from '../slices/notificationsSlice';
import { listenerMiddleware } from "./listeners";
import ModalsSlice from "../slices/Modals";

export const store = configureStore({
  reducer: {
    users: usersReducer,
    projects: projectsReducer,
    auth: Auth,
    notifications: notificationsReducer,
    modals: ModalsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    // 1) خذ الـ default middleware
    // 2) ضمّن api.middleware (مهم لـ RTK Query)
    // 3) ضمّن listener middleware (إما prepend أو concat حسب اللي تفضله)
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware) // لو عايز الـ listener يبقى أول واحد
});
