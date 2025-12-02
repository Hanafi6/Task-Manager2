import { createSelector } from "@reduxjs/toolkit"; // or 'reselect'

// base selectors
const selectNotificationsState = state => state.notifications;
const selectAllNotiIds = state => selectNotificationsState(state).allIds;
const selectNotiById = state => selectNotificationsState(state).byId;
const selectCurrentUserId = state => state.auth?.user?.id; // افتراض

// derived array of notifications (ordered newest first)
export const selectAllNotifications = createSelector(
    [selectNotiById, selectAllNotiIds],
    (byId, allIds) => allIds.map(id => byId[id]).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
);

// 1) notifications directed to the user OR for projects the user is a member in
export const selectUserNotifications = createSelector(
    [selectAllNotifications, selectCurrentUserId, state => state.projects?.list || []],
    (allNoti, userId, projectsList) => {
        // build set of projectIds user is member of
        const projectsSet = new Set();
        for (const p of projectsList) {
            if (Array.isArray(p.members) && p.members.map(String).includes(String(userId))) projectsSet.add(String(p.id));
        }

        return allNoti.filter(n => {
            // directed to user
            if (String(n.toUserId) === String(userId)) return true;
            // or notification about a project the user is in
            if (n.projectId && projectsSet.has(String(n.projectId))) return true;
            // or global broadcast (toUserId === null) -> include if project member or special types
            if (!n.toUserId && n.projectId && projectsSet.has(String(n.projectId))) return true;
            return false;
        });
    }
);

// 2) unread only selector
export const selectUserUnreadNotifications = createSelector(
    [selectUserNotifications],
    (userNoti) => userNoti.filter(n => n.status === "unread")
);

// 3) filter by projectId
export const makeSelectNotificationsByProject = (projectId) => createSelector(
    [selectUserNotifications],
    (userNoti) => userNoti.filter(n => String(n.projectId) === String(projectId))
);

// 4) filter by type(s)
export const makeSelectByTypes = (types = []) => createSelector(
    [selectUserNotifications],
    (userNoti) => {
        if (!types || types.length === 0) return userNoti;
        const tset = new Set(types);
        return userNoti.filter(n => tset.has(n.type));
    }
);

// 5) approvals pending for current user (notifications that require action)
export const selectApprovalsPendingForMe = createSelector(
    [selectUserNotifications, selectCurrentUserId],
    (userNoti, userId) => {
        return userNoti.filter(n => {
            // convention: meta.action contains requiredAction and requiredRole or toUserId === me
            if (n.type === "task_delete_request") {
                // if toUserId points to me OR meta.requires === "approver" and I'm approver (backend should set toUserId ideally)
                if (String(n.toUserId) === String(userId)) return true;
                if (n.meta?.requires === "approver" && /* you can check role map in meta */ true) return true;
            }
            // other actionable types e.g., assignment_request, invite
            if (n.meta?.actionRequired === true && String(n.toUserId) === String(userId)) return true;
            return false;
        });
    }
);

// 6) unassigned tasks in a given project (special view)
export const makeSelectUnassignedTaskNotisForProject = (projectId) => createSelector(
    [selectUserNotifications],
    (userNoti) => userNoti.filter(n => String(n.projectId) === String(projectId) && n.type === "task_assignment" && (!n.taskSnapshot?.assignedTo || n.taskSnapshot.assignedTo === null))
);

// 7) combined filter factory (search + types + unread + project + approverOnly + timeRange)
export const makeSelectFilteredNotifications = ({
    search = "",
    types = [],
    unreadOnly = false,
    projectIds = [],
    approverOnly = false,
    dateFrom,
    dateTo
} = {}) => createSelector(
    [selectUserNotifications, selectCurrentUserId],
    (userNoti, userId) => {
        let list = userNoti;

        if (unreadOnly) list = list.filter(n => n.status === "unread");

        if (Array.isArray(projectIds) && projectIds.length) {
            const set = new Set(projectIds.map(String));
            list = list.filter(n => n.projectId && set.has(String(n.projectId)));
        }

        if (types && types.length) {
            const tset = new Set(types);
            list = list.filter(n => tset.has(n.type));
        }

        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(n => (
                (n.title && n.title.toLowerCase().includes(q)) ||
                (n.message && n.message.toLowerCase().includes(q)) ||
                (n.taskSnapshot?.title && n.taskSnapshot.title.toLowerCase().includes(q))
            ));
        }

        if (approverOnly) {
            list = list.filter(n => {
                if (n.type === "task_delete_request") {
                    // only those directed to me
                    return String(n.toUserId) === String(userId) || n.meta?.requires === "approver";
                }
                return false;
            });
        }

        if (dateFrom || dateTo) {
            const fromTs = dateFrom ? new Date(dateFrom).getTime() : -Infinity;
            const toTs = dateTo ? new Date(dateTo).getTime() : Infinity;
            list = list.filter(n => {
                const t = new Date(n.createdAt).getTime();
                return t >= fromTs && t <= toTs;
            });
        }

        // final sort newest first
        return list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
);
