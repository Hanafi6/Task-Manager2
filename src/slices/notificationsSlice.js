// src/store/notificationsSlice.js
import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import { getData, postData, updateData, deleteData } from "../api/api";

/**
 * notificationsSlice
 *
 * كل إشعار عنده الشكل المتوقع (مثال):
 * {
 *   id: "c6f5",
 *   type: "task_deleted_team" | "task_delete_request" | ...,
 *   title: "Task deleted",
 *   message: "Task \"X\" was deleted from \"Project Y\"",
 *   fromUserId: 5,
 *   toUserId: 2,
 *   projectId: 5,
 *   taskId: 18,
 *   taskSnapshot: { ... } | null,   // important for restore
 *   status: "unread" | "read" | "dismissed",
 *   meta: { ... }                   // أي بيانات إضافية (dedupeKey, source)
 *   createdAt: "2025-11-05T..."
 * }
 *
 * الافتراض: هناك API endpoints بسيطة عبر json-server:
 * GET  /notifications
 * POST /notifications
 * PUT  /notifications/:id
 * DELETE /notifications/:id
 *
 * لو الـ API عندك مختلف، عدّل دوال getData/postData/updateData accordingly.
 */

/* ------------------ Thunks ------------------- */

/**
 * createNotificationApi
 * - يُستخدم من الـ listeners أو أي مكان لإضافة إشعار.
 * - يضيف الشئ أولاً محلياً (optimistic) ثم يحاول POST للـ API.
 * - payload يجب أن يحتوي الحقول المذكورة أعلاه (type, title, message, toUserId, ...)
 */
export const createNotificationApi = createAsyncThunk(
    "notifications/create",
    async (payload, { rejectWithValue }) => {
        try {
            const now = new Date().toISOString();
            const n = {
                id: payload.id || nanoid(6),
                ...payload,
                status: payload.status || "unread",
                createdAt: payload.createdAt || now,
            };
            // Deduplicate: check server for a recent similar notification
            // Query by toUserId and type, then filter by project/task and recent timestamp
            try {
                const recent = await getData(`notifications?toUserId=${encodeURIComponent(n.toUserId)}&type=${encodeURIComponent(n.type)}`);
                if (Array.isArray(recent) && recent.length) {
                    const nowTs = Date.now();
                    const MATCH_WINDOW_MS = 10 * 1000; // 10 seconds
                    const match = recent.find((r) => {
                        try {
                            const sameProject = String(r.projectId) === String(n.projectId);
                            const sameTask = (r.taskId == null && n.taskId == null) || String(r.taskId) === String(n.taskId);
                            const sameMessage = String(r.message || "") === String(n.message || "");
                            const createdAtTs = r.createdAt ? Date.parse(r.createdAt) : 0;
                            const recentEnough = nowTs - createdAtTs < MATCH_WINDOW_MS;
                            return sameProject && sameTask && sameMessage && recentEnough;
                        } catch (e) {
                            return false;
                        }
                    });
                    if (match) {
                        // Return existing one to avoid creating a duplicate
                        return match;
                    }
                }
            } catch (e) {
                // If the dedupe check fails, fall back to attempting to create the notification.
                console.warn("Notification dedupe check failed:", e?.message || e);
            }
            // محاولة إرسال للسيرفر
            const created = await postData("notifications", n);
            // json-server عادة يرجع ה‍created object
            return created || n;
        } catch (e) {
            // لو فشل، ارجع الـ payload علشان نقدر نعرض خطأ أو نتعامل معه
            return rejectWithValue(payload);
        }
    }
);

/**
 * fetchNotifications
 * - جلب كل الإشعارات (يوزر محدد أو كلها حسب ال API)
 * - هنا نطلب كل الإشعارات من السيرفر
 */
export const fetchNotifications = createAsyncThunk(
    "notifications/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            const list = await getData("notifications");
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return rejectWithValue(String(e?.message || e));
        }
    }
);

/**
 * markNotificationRead
 * - يحدّث حالة الإشعار إلى "read"
 */
export const markNotificationRead = createAsyncThunk(
    "notifications/markRead",
    async (notificationId, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const n = (state.notifications.list || []).find((x) => String(x.id) === String(notificationId));
            if (!n) throw new Error("Notification not found");
            const updated = { ...n, status: "read" };
            const res = await updateData("notifications", notificationId, updated);
            if (!res.ok) throw new Error("Failed to update notification");
            const data = await res.json();
            return data;
        } catch (e) {
            return rejectWithValue(String(e?.message || e));
        }
    }
);

/**
 * dismissNotification
 * - يحدف الإشعار محلياً و يحاول حذف من السيرفر (soft dismiss => status=dismissed ممكن بدلاً من حذف)
 * - هنا نفذ حذف حقيقي عبر DELETE إذا تفضل
 */
export const dismissNotification = createAsyncThunk(
    "notifications/dismiss",
    async (notificationId, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const n = (state.notifications.list || []).find((x) => String(x.id) === String(notificationId));
            if (!n) throw new Error("Notification not found");

            // خيار 1: soft delete (تغيير status to dismissed) و PUT
            const updated = { ...n, status: "dismissed" };
            const res = await updateData("notifications", notificationId, updated);
            if (!res.ok) throw new Error("Failed to dismiss notification");
            const data = await res.json();
            return data;

            // // خيار 2: حذف نهائي من DB
            // const res = await deleteData("notifications", notificationId);
            // if (!res.ok) throw new Error("Failed to delete notification");
            // return { id: notificationId, deleted: true };
        } catch (e) {
            return rejectWithValue(String(e?.message || e));
        }
    }
);

/**
 * restoreTaskFromNotification
 * - يعيد التاسك للمشروع باستخدام taskSnapshot المضمّن في الإشعار.
 * - يتوقع إشعار فيه .taskSnapshot و projectId.
 * - سلوك: يجيب المشروع، يضيف التاسك من الـ snapshot إلى project.tasks ثم يحدث المشروع في السيرفر.
 */
export const restoreTaskFromNotification = createAsyncThunk(
    "notifications/restoreTaskFromNotification",
    async ({ notificationId }, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const n = (state.notifications.list || []).find((x) => String(x.id) === String(notificationId));
            if (!n) throw new Error("Notification not found");
            const snapshot = n.taskSnapshot;
            const projectId = n.projectId;
            if (!snapshot || !projectId) throw new Error("No snapshot or projectId to restore");

            // 1) احضر المشروع من السيرفر
            const project = await getData(`projects/${projectId}`);
            if (!project) throw new Error("Project not found");

            // 2) اذا نفس الـ taskId موجود فتجنّب الازدواج
            const exists = (project.tasks || []).some((t) => String(t.id) === String(snapshot.id));
            if (exists) {
                return rejectWithValue("Task already exists in project");
            }

            // 3) أضف التاسك مع تحديث الحقول timestamps
            const restoredTask = {
                ...snapshot,
                restoredAt: new Date().toISOString(),
                createdAt: snapshot.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const updatedProject = { ...project, tasks: [...(project.tasks || []), restoredTask] };
            const res = await updateData("projects", projectId, updatedProject);
            if (!res.ok) throw new Error("Failed to restore task to project");
            const data = await res.json();

            // 4) نحدث الإشعار نفسه إلى dismissed/read
            const notifyRes = await updateData("notifications", notificationId, { ...n, status: "read" });
            // ignore notifyRes.ok check to not block restore result

            return { notificationId, projectId, task: restoredTask, updatedProject: data };
        } catch (e) {
            return rejectWithValue(String(e?.message || e));
        }
    }
);

/* ------------------ Slice ------------------- */

const notificationsSlice = createSlice({
    name: "notifications",
    initialState: {
        list: [], // array of notifications
        loading: false,
        error: null,
    },
    reducers: {
        // إضافة محلية سريعة (بدون API) — مفيدة للـ optimistic updates
        addNotificationLocal(state, action) {
            const n = action.payload;
            state.list.unshift(n);
        },
        // وضع حالة خطأ للاستخدام العام
        clearError(state) {
            state.error = null;
        },
        // حذف محلي
        removeNotificationLocal(state, action) {
            const id = action.payload;
            state.list = state.list.filter((x) => String(x.id) !== String(id));
        },
        // تمييز كـ read محلي
        markReadLocal(state, action) {
            const id = action.payload;
            const i = state.list.findIndex((x) => String(x.id) === String(id));
            if (i !== -1) state.list[i].status = "read";
        },
    },
    extraReducers: (builder) => {
        // fetch
        builder.addCase(fetchNotifications.pending, (s) => {
            s.loading = true;
            s.error = null;
        });
        builder.addCase(fetchNotifications.fulfilled, (s, action) => {
            s.loading = false;
            s.list = (action.payload || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
        builder.addCase(fetchNotifications.rejected, (s, action) => {
            s.loading = false;
            s.error = action.payload || action.error?.message || "Failed to fetch notifications";
        });

        // create
        builder.addCase(createNotificationApi.pending, (s) => {
            s.error = null;
        });
        builder.addCase(createNotificationApi.fulfilled, (s, action) => {
            // push the created notification to top
            if (action.payload) {
                s.list.unshift(action.payload);
            }
        });
        builder.addCase(createNotificationApi.rejected, (s, action) => {
            // action.payload contains original payload on failure (as we returned in rejectWithValue)
            s.error = "Failed to create notification";
            // if you want to still show local fallback, you can push action.payload
            if (action.payload) {
                s.list.unshift({ ...action.payload, id: action.payload.id || nanoid(6), status: "unread", createdAt: new Date().toISOString() });
            }
        });

        // markRead
        builder.addCase(markNotificationRead.fulfilled, (s, action) => {
            const updated = action.payload;
            const i = s.list.findIndex((x) => String(x.id) === String(updated.id));
            if (i !== -1) s.list[i] = updated;
        });
        builder.addCase(markNotificationRead.rejected, (s, action) => {
            s.error = action.payload || action.error?.message || "Failed to mark notification read";
        });

        // dismiss
        builder.addCase(dismissNotification.fulfilled, (s, action) => {
            const updated = action.payload;
            const i = s.list.findIndex((x) => String(x.id) === String(updated.id));
            if (i !== -1) s.list[i] = updated;
        });
        builder.addCase(dismissNotification.rejected, (s, action) => {
            s.error = action.payload || action.error?.message || "Failed to dismiss notification";
        });

        // restore
        builder.addCase(restoreTaskFromNotification.fulfilled, (s, action) => {
            const { notificationId } = action.payload || {};
            // علام الإشعار كمقروء / dismissed
            const i = s.list.findIndex((x) => String(x.id) === String(notificationId));
            if (i !== -1) s.list[i].status = "read";
        });
        builder.addCase(restoreTaskFromNotification.rejected, (s, action) => {
            s.error = action.payload || action.error?.message || "Failed to restore from notification";
        });
    },
});

export const {
    addNotificationLocal,
    clearError,
    removeNotificationLocal,
    markReadLocal,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

/* ------------------ Selectors ------------------- */

export const selectNotificationsList = (s) => s.notifications?.list || [];
export const selectNotificationsForUser = (userId) =>
    (s) => (s.notifications?.list || []).filter((n) => String(n.toUserId) === String(userId));
export const selectUnreadCountForUser = (userId) =>
    (s) => (s.notifications?.list || []).filter((n) => String(n.toUserId) === String(userId) && n.status === "unread").length;
