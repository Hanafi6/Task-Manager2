// src/store/listeners.js
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { requestDeleteTask, confirmDeleteTask, addTask } from "../slices/projectsSlice";
// removed import of apiSlice per your request
import { loginUser, logoutUser } from "../slices/AuthSlice";
import { createNotificationApi } from "../slices/notificationsSlice";
import { GetUsersSelectors, selectUserId } from "./selectors";

export const listenerMiddleware = createListenerMiddleware();

const recentNotifications = new Map();
const DEDUPE_WINDOW_MS = 10 * 1000;

function shouldDedupe(key) {
    const now = Date.now();
    const last = recentNotifications.get(key);
    if (!last || now - last > DEDUPE_WINDOW_MS) {
        recentNotifications.set(key, now);
        return false;
    }
    return true;
}

/**
 * deepSerializeDates(obj)
 * - يحول أي Date داخل الـ payload إلى ISO strings (recursively)
 * - يتعامل مع arrays و nested objects، ويحافظ على القيم البدائية كما هي
 */
function deepSerializeDates(obj) {
    if (obj == null) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(deepSerializeDates);
    if (typeof obj === "object") {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            if (k === "time" && typeof v === "object" && v !== null) {
                const timeObj = {};
                if (v.start) timeObj.start = deepSerializeDates(v.start);
                if (v.end) timeObj.end = deepSerializeDates(v.end);
                for (const [tk, tv] of Object.entries(v)) {
                    if (tk !== "start" && tk !== "end") timeObj[tk] = deepSerializeDates(tv);
                }
                out[k] = timeObj;
                continue;
            }
            out[k] = deepSerializeDates(v);
        }
        return out;
    }
    return obj;
}

/**
 * safeDispatchNotification(listenerApi, payload)
 * - يضبط التواريخ و يستخدم createNotificationApi (من notifications slice)
 * - wrapped in try/catch عشان أي خطأ في listener ما يوقف الباقي
 */
async function safeDispatchNotification(listenerApi, payload) {
    try {
        const safePayload = deepSerializeDates(payload || {});
        // Ensure createdAt is ISO string
        if (safePayload.createdAt && safePayload.createdAt instanceof Date) {
            safePayload.createdAt = safePayload.createdAt.toISOString();
        }
        await listenerApi.dispatch(createNotificationApi(safePayload));
    } catch (err) {
        console.error("Failed to create notification (listener):", err);
    }
}

/**
 * sendNotification(listenerApi, payload)
 * - تم تغييره لعدم استخدام RTK Query نهائياً
 * - الآن فقط يستدعي safeDispatchNotification (أي يعتمد على notifications slice)
 * - يحتفظ بنفس واجهة الاستخدام (يرجع نتيجة الـ thunk dispatch promise)
 */
async function sendNotification(listenerApi, payload) {
    try {
        const safePayload = deepSerializeDates(payload || {});
        return await safeDispatchNotification(listenerApi, safePayload);
    } catch (err) {
        console.error("Failed to send notification (listener):", err);
    }
}

/* ------------------ Listeners ------------------ */

/**
 * requestDeleteTask.fulfilled
 * - يحدث عند طلب حذفٍ ما؛ يرسل إشعارات للـ approvers أو للفريق كـ fallback
    لو اللي بيحذف يوزر عادي يبعت ريكويست حذف

*/
listenerMiddleware.startListening({
    actionCreator: requestDeleteTask.fulfilled,
    effect: async (action, listenerApi) => {
        try {
            const { projectId, taskId, userId, taskSnapshot, updatedProject } = action.payload || {};
            const state = listenerApi.getState();
            const project = state.projects?.list?.find((p) => String(p.id) === String(projectId)) || updatedProject || null;

            const taskTitle = taskSnapshot?.title || `#${taskId}`;
            const actorId = String(userId || action.meta?.arg?.userId || "unknown");

            const approvers = new Set();
            if (project?.leaderId) approvers.add(String(project.leaderId));
            if (project?.admins && Array.isArray(project.admins)) {
                project.admins.forEach((a) => approvers.add(String(a)));
            }
            if (approvers.size === 0 && action.payload?.approverIds) {
                (action.payload.approverIds || []).forEach((a) => approvers.add(String(a)));
            }

            const title = `Delete requested: ${taskTitle}`;
            const message = `User ${actorId} requested deletion for task "${taskTitle}" in project "${project?.name || projectId}"`;

            const fallbackRecipients = project?.leaderId ? [String(project.leaderId)] : (project?.members || []).map(String);
            const recipients = Array.from(new Set(approvers.size ? Array.from(approvers) : fallbackRecipients));

            for (const toUserId of recipients) {
                const dedupeKey = `reqDel:${projectId}:${taskId}:${toUserId}`;
                if (shouldDedupe(dedupeKey)) continue;

                await sendNotification(listenerApi, {
                    type: "task_delete_request",
                    title,
                    message,
                    fromUserId: actorId,
                    toUserId,
                    projectId: String(projectId),
                    taskId,
                    taskSnapshot: taskSnapshot || null,
                    meta: { phase: "request" },
                    status: "unread",
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (err) {
            console.error("Error in requestDeleteTask listener:", err);
        }
    },
});

/**
 * confirmDeleteTask.fulfilled
 * - بعد الموافقة أو الرفض على حذف، نبعت إشعارات للفريق وللطالب
 * - نضمّ undoUntil داخل meta لو الحذف تم (undoable)
    تأكيد الحذف
*/
listenerMiddleware.startListening({
    actionCreator: confirmDeleteTask.fulfilled,
    effect: async (action, listenerApi) => {
        try {
            const payload = action.payload || {};
            const Abrov = action.meta.arg.Abrov || null;

            const { projectId, taskId, approverId, deleted, updatedProject } = payload;
            const originalTaskSnapshot = action.meta?.arg?.taskSnapshot || payload.taskSnapshot || null;

            // actor = الأدمن / اللي وافق أو رفض
            const actor = String(approverId || action.meta?.arg?.approverId || "system");

            const state = listenerApi.getState();
            const project =
                state.projects?.list?.find((p) => String(p.id) === String(projectId)) ||
                updatedProject ||
                null;

            const members = Array.from(
                new Set((project?.members || []).map((m) => String(m)))
            );

            const taskTitle = originalTaskSnapshot?.title || `#${taskId}`;

            // recipients: Map(userId -> { kinds: Set, wantsUndo: bool })
            const recipients = new Map();

            // -------------------------
            // 1) نضيف الفريق (ماعدا الأدمن)
            // -------------------------
            for (const m of members) {
                if (String(m) === actor) continue; // الأدمن لسه هنضيفه تحت لوحده
                recipients.set(String(m), { kinds: new Set(["team"]), wantsUndo: false });
            }

            // -------------------------
            // 2) نضيف صاحب الطلب (requester)
            // -------------------------
            const requesterIdRaw =
                action.meta?.arg?.requesterId ||
                payload.requesterId ||
                payload.userId ||
                "";
            const requesterId = requesterIdRaw ? String(requesterIdRaw) : "";

            if (requesterId && requesterId !== actor) {
                const existing = recipients.get(requesterId);
                if (existing) {
                    existing.kinds.add("requester");
                    recipients.set(requesterId, existing);
                } else {
                    recipients.set(requesterId, {
                        kinds: new Set(["requester"]),
                        wantsUndo: false,
                    });
                }
            }

            // -------------------------
            // 3) نضيف الأدمن (actor) بنوع مختلف
            // -------------------------
            if (actor && actor !== "system") {
                const existing = recipients.get(actor);
                if (existing) {
                    // لو هو كمان member أو requester
                    existing.kinds.add("actor");
                    recipients.set(actor, existing);
                } else {
                    recipients.set(actor, {
                        kinds: new Set(["actor"]),
                        wantsUndo: false,
                    });
                }
            }

            // لو الحذف فعلاً -> wantsUndo true لكل الناس (ممكن تشيلها عن actor لو مش عايز undo عنده)
            if (deleted) {
                for (const [uid, info] of recipients) {
                    info.wantsUndo = true;
                    recipients.set(uid, info);
                }
            }

            const teamMessage = deleted
                ? `Task "${taskTitle}" was deleted by user ${Abrov?.name || actor} from project "${project?.name || projectId}"`
                : `Delete request for task "${taskTitle}" was rejected by user ${Abrov?.name || actor} in project "${project?.name || projectId}"`;

            const sendPromises = [];
            const undoExpiry = deleted
                ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
                : null;

            for (const [toUserId, info] of recipients) {
                const dedupeKey = `confirmDel:${projectId}:${taskId}:${toUserId}:${deleted ? "deleted" : "rejected"
                    }`;
                if (shouldDedupe(dedupeKey)) continue;

                const kindsArr = Array.from(info.kinds);
                let type, title, message;

                // ⭐ 1) نوتيفيكيشن "مختلف" للأدمن (actor)
                if (kindsArr.includes("actor")) {
                    type = deleted
                        ? "task_delete_actor_approved"
                        : "task_delete_actor_rejected";
                    title = deleted
                        ? "You approved deleting a task"
                        : "You rejected a delete request";
                    message = deleted
                        ? `You approved deleting task "${taskTitle}" in project "${project?.name || projectId}".`
                        : `You rejected the delete request for task "${taskTitle}" in project "${project?.name || projectId}".`;
                }
                // ⭐ 2) نوتيفيكيشن خاصة بصاحب الطلب (لو مش team بس)
                else if (kindsArr.includes("requester") && !kindsArr.includes("team")) {
                    type = deleted ? "task_delete_approved" : "task_delete_denied";
                    title = deleted ? "Delete request approved" : "Delete request denied";
                    message = deleted
                        ? `Your delete request for "${taskTitle}" was approved by user ${Abrov?.name || actor
                        }.`
                        : `Your delete request for "${taskTitle}" was rejected by user ${Abrov?.name || actor
                        }.`;
                }
                // ⭐ 3) باقي الفريق (team)
                else {
                    type = deleted ? "task_deleted_team" : "task_delete_rejected";
                    title = deleted ? "Task deleted" : "Delete request rejected";
                    message = teamMessage;
                }

                const payloadToSend = {
                    type,
                    title,
                    message,
                    fromUserId: actor, // الأدمن اللي عمل approve/reject
                    toUserId,          // المستلم (ممكن يكون أدمن, requester, أو team member)
                    projectId: String(projectId),
                    taskId,
                    taskSnapshot: originalTaskSnapshot
                        ? deepSerializeDates(originalTaskSnapshot)
                        : null,
                    meta: {
                        deleted: !!deleted,
                        kinds: kindsArr,
                        ...(info.wantsUndo ? { undoUntil: undoExpiry } : {}),
                    },
                    notificationGroupId: `project:${projectId}:task:${taskId}`,
                    status: "unread",
                    createdAt: new Date().toISOString(),
                };

                console.log("notif to send: ", payloadToSend);

                sendPromises.push(sendNotification(listenerApi, payloadToSend));
            }

            if (sendPromises.length) await Promise.all(sendPromises);
        } catch (err) {
            console.error("Error in confirmDeleteTask listener:", err);
        }
    },
});

/**
 * loginUser.fulfilled -> نبعث إشعار ترحيبي للمستخدم
    لو اليوزر عمل لوج ان
*/
listenerMiddleware.startListening({
    actionCreator: loginUser.fulfilled,
    effect: async (action, listenerApi) => {
        try {
            const user = action.payload;
            if (!user || !user.id) return;

            const toUserId = String(user.id);
            const dedupeKey = `login:${toUserId}:${user?.lastLogin || "x"}`;

            if (shouldDedupe(dedupeKey)) return;

            const payload = {
                type: "user_login",
                title: `Welcome back, ${user.name || "user"}!`,
                message: `${user.name || "A user"} logged in at ${new Date().toLocaleString()}`,
                fromUserId: null,
                toUserId,
                projectId: null,
                taskId: null,
                taskSnapshot: null,
                meta: { source: "auth-listener", event: "login" },
                status: "unread",
                createdAt: new Date().toISOString(),
            };

            await safeDispatchNotification(listenerApi, payload);
        } catch (err) {
            console.error("login listener error:", err);
        }
    },
});

/**
 * logoutUser.fulfilled -> (اختياري) نبعث إشعار تسجيل الخروج
    لو اليوزر عمل لوج اوت
*/
listenerMiddleware.startListening({
    actionCreator: logoutUser.fulfilled,
    effect: async (action, listenerApi) => {
        try {
            const payloadFromAction = action.payload || {};
            const metaArg = action.meta?.arg || {};
            const userId = payloadFromAction.id || metaArg.userId || metaArg.id;
            if (!userId) return;

            const toUserId = String(userId);
            const dedupeKey = `logout:${toUserId}:${Date.now()}`;

            if (shouldDedupe(dedupeKey)) return;

            const payload = {
                type: "user_logout",
                title: `Logged out`,
                message: `You logged out at ${new Date().toLocaleString()}`,
                fromUserId: null,
                toUserId,
                projectId: null,
                taskId: null,
                taskSnapshot: null,
                meta: { source: "auth-listener", event: "logout" },
                status: "unread",
                createdAt: new Date().toISOString(),
            };

            await safeDispatchNotification(listenerApi, payload);
        } catch (err) {
            console.error("logout listener error:", err);
        }
    },
});


// لو اليوزر حب ينشء تاسك جديد، نبعت إشعار للفريق
listenerMiddleware.startListening({
    actionCreator: addTask.fulfilled,
    effect: async (action, listenerApi) => {
        try {
            const { projectId, task, updatedProject } = action.payload || {};
            const state = listenerApi.getState();
            const project = state.projects?.list?.find((p) => String(p.id) === String(projectId)) || updatedProject || null;
            const Creater = listenerApi.getState().auth?.usersList.find(u => String(u.id) == String(action.meta?.arg?.createdBy)) || null;

            const actorId = String(action.meta?.arg?.createdBy || "unknown");

            const taskTitle = task?.title || `#${task?.id || "unknown"}`;

            const title = `New Task Added: ${taskTitle} by ${Creater?.name || actorId}`;
            const message = `User ${actorId} added a new task "${taskTitle}" to project "${project?.name || projectId}"`;
            const members = Array.from(new Set((project?.members || []).map(String)));
            for (const toUserId of members) {
                const dedupeKey = `addTask:${projectId}:${task.id}:${toUserId}`;

                console.log(toUserId, Creater.id);
                if (shouldDedupe(dedupeKey)) continue;

                await sendNotification(listenerApi, {
                    type: `task_added ${toUserId === actorId ? "own" : "team"} to ${project.title || projectId}`,
                    title,
                    message,
                    fromUserId: actorId,
                    toUserId,
                    projectId: String(projectId),
                    taskId: task.id,
                    taskSnapshot: task ? deepSerializeDates(task) : null,
                    meta: { phase: "added" },
                    status: "unread",
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (err) {
            console.error("Error in addTask listener:", err);
        }
    },
})

export default listenerMiddleware;
