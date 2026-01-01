// store/selectors.js
import { createSelector } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";

/*───────────────────────────────
 🟢 [1] Projects & Tasks (أساسيات)
───────────────────────────────*/

// ✅ بيرجع المشاريع اللي حالتها "active"
export const selectActiveProjects = (state) =>
  (state.projects?.list || []).filter(p => p.status === "active");

// ✅ بيرجع كل المهام (فلات من كل المشاريع)
export const selectAllTasks = (state) => state.projects?.tasks || [];


export const GetTaskeById = (state,id) =>  state.projects.tasks.find(e => e.id == id) || null;
export const GetProjectById = (state,id) =>  state.projects.list.find(e => e.id == id) || null;
// ✅ بيرجع كل المستخدمين
export const selectUsers = (s) => s.auth?.usersList || [];
// ✅ بيرجع بيانات اليوزر الحالي (المسجل دخول)
export const selectUser = (s) => s.auth?.user || {};

export const selectUserId = (id, users) => users.find(e => e.id == id);

// ✅ بيرجع كل المشاريع
export const selectProjects = (s) => s.projects?.list || [];

// ✅ بيرجع كل المهام
export const selectTasks = (s) => s?.projects?.tasks || [];

// ✅ بيرجع الـ ID للمهمة المحددة في الـ UI (لو المستخدم اختار تاسك)
export const selectSelectedTaskId = (s) => s.projects?.selectedTaskId ?? null;

// ✅ بيرجع الـ ID للمشروع المحدد في الـ UI (لو المستخدم اختار بروجيكت)
export const selectSelectedProjectId = (s) => s.projects?.selectProject ?? null;

// Geet Users As Array Of  [{name, id}]
export const GetUsersSelectors = (members) => {
  return createSelector([selectUsers], (users) => {
    if (!members || !Array.isArray(members)) return [];
    return users.filter((user) => members.includes(+user.id));
  });
};


// Not Support
// export function GetTaskes(projectId) {
//   const tasks = useSelector(s => s.projects.tasks)
//   const MinTasks = tasks.filter(e => {
//     console.log(e)
//     console.log(projectId)
//   })
// }

/*───────────────────────────────
 🟢 [2] مشاريع المستخدم النشطة فقط
───────────────────────────────*/
// ✅ makeSelectActiveProjectsForUser(userId)
// بيرجع المشاريع النشطة اللي المستخدم:
// - هو قائدها (leader)
// - أو عضو فيها (members)
// - أو عنده تاسكات فيها
export const makeSelectActiveProjectsForUser = (userId) => createSelector(
  [selectActiveProjects, selectAllTasks],
  (projects, tasks) => {
    if (!userId) return [];
    const uid = Number(userId);
    const projIdsWithMyTasks = new Set(
      tasks.filter(t => Number(t.assignedTo) === uid).map(t => t.projectId)
    );
    return projects.filter(p =>
      p.leaderId === uid ||
      (Array.isArray(p.members) && p.members.includes(uid)) ||
      projIdsWithMyTasks.has(p.id)
    );
  }
);

export const makeSelectALLProjectsForUser = (userId) => createSelector(
  [selectProjects, selectAllTasks],
  (projects, tasks) => {
    if (!userId) return [];
    if (!tasks) return [];
    if (!projects) return [];

    const uid = Number(userId);
    const projIdsWithMyTasks = new Set(
      tasks.filter(t => Number(t.assignedTo) == uid).map(t => t.projectId)
    );
    return projects.filter(p =>
      p.leaderId === uid ||
      (Array.isArray(p.members) && p.members.includes(uid)) ||
      projIdsWithMyTasks.has(p.id)
    );
  }
);



/*───────────────────────────────
 🟢 [3] مهام المستخدم النشطة فقط
───────────────────────────────*/
// ✅ makeSelectMyActiveTasks(userId)
// بيرجع كل المهام اللي متعيّنة للمستخدم
// بشرط إن المشروع بتاعها يكون "active"
export const makeSelectMyActiveTasks = (userId) => createSelector(
  [selectAllTasks, selectActiveProjects],
  (tasks, projects) => {
    if (!userId) return [];
    const uid = Number(userId);
    const activeIds = new Set(projects.map(p => p.id));
    return tasks.filter(t => Number(t.assignedTo) === uid && activeIds.has(t.projectId));
  }
);

/*───────────────────────────────
 🟢 [4] إحصائيات عامة للإدمن
───────────────────────────────*/
// ✅ selectAdminStats()
// بيرجع: عدد المشاريع النشطة + إجمالي المهام + توزيع المهام حسب الحالة
export const selectAdminStats = createSelector(
  [selectActiveProjects, selectAllTasks],
  (projects, tasks) => {
    const counts = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    return {
      activeProjects: projects.length,
      tasksTotal: tasks.length,
      tasksByStatus: {
        todo: counts["todo"] || 0,
        inProgress: counts["in progress"] || 0,
        blocked: counts["blocked"] || 0,
        done: counts["done"] || 0,
      },
    };
  }
);




/*───────────────────────────────
 🧱 Selectors أساسية
───────────────────────────────*/


// بيرجع مشروع فردي بالID
export const selectProjectById = (projectId) =>
  createSelector([selectProjects], (projects) => {
    const project = projects.find((p) => String(p.id) === String(projectId)) || null;
    return project;
  });



/*───────────────────────────────
 🧠 [5] أدوات الوقت الخاصة بالمهام
───────────────────────────────*/

// ✅ بتحسب حالة المهمة الزمنية:
// هل بدأت؟ انتهت؟ متأخرة؟ ومعاها وقت متبقي
export function computeTaskTimeMeta(task, now = new Date()) {

  if (!task) return
  const start = task.startAt ? new Date(task.startAt) : null;
  const end = task.endAt ? new Date(task.endAt) : (task.dueDate ? new Date(task.dueDate) : null);

  const inWindow = (!start || now >= start) && (!end || now <= end);
  const msLeft = end ? end - now : null;
  const isOverdue = end ? now > end && task.status !== "done" : false;

  const isDisabled = task.status === "done" || task.status === "blocked" || isOverdue;

  return { start, end, msLeft, inWindow, isOverdue, isDisabled };
}

// ✅ بتنسق الوقت المتبقي بصيغة جميلة (مثلاً: "2d 4h" أو "30m")
export function formatDuration(ms) {
  if (ms == null) return "—";
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [d ? `${d}d` : null, h ? `${h}h` : null, m ? `${m}m` : null, sec ? `${sec}s` : null]
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}



/*───────────────────────────────
 🧩 [6] Selectors خاصة بالعلاقات
───────────────────────────────*/

// ✅ makeSelectTasksByUser(userId, { activeOnly })
// بيرجع كل المهام اللي متعيّنة على يوزر معين
// ولو حددت activeOnly=true → بيرجع بس اللي مشاريعها "active"
// بيرجع كمان مع كل تاسك: بيانات اليوزر، المشروع، ووقت التنفيذ
// store/selectors.js

export const makeSelectTasks = ({ userId, role, status = "all" } = {}) =>
  createSelector([selectTasks, selectProjects, selectUsers], (tasks, projects, users) => {
    const uid = Number(userId);

    // لو أدمن: يشوف كل المهام
    let filtered = role === "admin"
      ? tasks
      : tasks.filter(t => Number(t.assignedTo) === uid);
      

    // بناء الـ grouping حسب status
    const grouped = {};
    filtered.forEach((t) => {
      if (!grouped[t.status]) grouped[t.status] = [];
      grouped[t.status].push(t);
    });


    // فلترة active/done/all
    if (status === "active") {
      filtered = filtered.filter(t => t.status !== "done");
    } else if (status === "done") {
      filtered = filtered.filter(t => t.status === "done");
    }

    const userById = new Map(users.map(u => [Number(u.id), u]));
    const projById = new Map(projects.map(p => [Number(p.id), p]));


    const tasksWithMeta = filtered.map(t => ({
      ...t,
      user: userById.get(+t?.assignedTo) || null,
      project: projById.get(Number(t.projectId)) || null,
      time: computeTaskTimeMeta(t),
    }));
    return {
      list: tasksWithMeta,
      grouped,        // <-- ال object اللي انت عايزه
      statuses: Object.keys(grouped)
    };
  });



// ✅ makeSelectTaskDetails(taskId)
// بيرجع تفاصيل تاسك واحدة كاملة:
// بيانات المهمة + اليوزر + المشروع + حالة الوقت
// store/selectors.js (تصحيح)
export const makeSelectTaskDetails = (taskId) =>
  createSelector([selectTasks, selectUsers, selectProjects], (tasks = [], users = [], projects = []) => {
    if (!taskId) return null;

    // ابحث عن التاسك - تأكد من المقارنة بالـ String/Number
    const t = tasks.find((x) => String(x.id) === String(taskId));
    if (!t) return null; // <-- الحماية الأساسية: لو مش لقيت التاسك رجع null

    const user = users.find((u) => String(u.id) === String(t.assignedTo)) || null;
    const project = projects.find((p) => String(p.id) === String(t.projectId)) || null;

    return { ...t, user, project, time: computeTaskTimeMeta(t) };
  });


// ✅ makeSelectProjectById(projectId)
// بيرجع مشروع واحد بناءً على الـ ID
export const makeSelectProjectById = (projectId) =>
  createSelector([selectProjects], (projects) =>
    projects.find((p) => p.id == projectId) || null
  );

// ✅ makeSelectTasksByProjectId(projectId)
// بيرجع كل المهام اللي تابعة لمشروع معين + metadata الوقت
export const makeSelectTasksByProjectId = (projectId) =>
  createSelector([selectTasks], (tasks) =>
    tasks
      .filter((t) => t.projectId == projectId)
      .map((t) => ({ ...t, time: computeTaskTimeMeta(t) }))
  );

// ✅ makeSelectUserTasksGrouped(userId)
// بيرجع مهام المستخدم مجمعة حسب كل مشروع
// (للعرض في صفحة زي “مهامي في كل مشروع”)
export const makeSelectUserTasksGrouped = (userId) =>
  createSelector([selectTasks, selectProjects], (tasks, projects) => {
    const projById = new Map(projects.map((p) => [Number(p.id), p]));
    const mine = tasks.filter((t) => Number(t.assignedTo) === Number(userId));
    const groups = new Map();
    for (const t of mine) {
      const pid = Number(t.projectId);
      if (!groups.has(pid)) groups.set(pid, []);
      groups.get(pid).push({ ...t, time: computeTaskTimeMeta(t) });
    }
    return Array.from(groups.entries()).map(([pid, ts]) => ({
      project: projById.get(pid) || { id: pid, name: "Unknown project" },
      tasks: ts,
    }));
  });

// ✅ selectSelectedTask
// بيرجع المهمة اللي المستخدم اختارها حاليًا في الـ UI (لو فيه واحدة مختارة)
// ومعاها بيانات المشروع واليوزر والوقت
export const selectSelectedTask = createSelector(
  [selectSelectedTaskId, selectTasks, selectUsers, selectProjects],
  (tid, tasks, users, projects) => {
    if (!tid) return null;
    const t = tasks.find((x) => Number(x.id) === Number(tid));
    if (!t) return null;
    const user = users.find((u) => Number(u.id) === Number(t.assignedTo)) || null;
    const project = projects.find((p) => Number(p.id) === Number(t.projectId)) || null;
    return { ...t, user, project, time: computeTaskTimeMeta(t) };
  }
);

// ✅ selectSelectedProject
// بيرجع المشروع اللي المستخدم مختاره حاليًا في الـ UI
export const selectSelectedProject = createSelector(
  [selectSelectedProjectId, selectProjects],
  (pid, projects) => projects.find((p) => Number(p.id) === Number(pid)) || null
);

// ✅ makeSelectUserProjects(userId)
export const makeSelectUserProjects = (userId) => createSelector(
  [selectProjects],
  (projects) => {
    const uid = Number(userId);
    return projects.filter(
      (p) => Number(p.leaderId) === uid || (Array.isArray(p.members) && p.members.includes(uid))
    );
  }
);

/** helpers: IDs المشاركين على مهمة (owner + collaborators[]) */
const usersOnTask = (t) => {
  const main = t.assignedTo != null ? [Number(t.assignedTo)] : [];
  const collabs = Array.isArray(t.collaborators) ? t.collaborators.map(Number) : [];
  return Array.from(new Set([...main, ...collabs]));
};

/**
 * بيرجّع structure بالشكل:
 * [
 *   {
 *     project,
 *     collaborators: [
 *        { user, tasksCountWithYou }  // عدد المهام في المشروع اللي الشخص ده مشارك فيها (owner/collab)
 *     ]
 *   }, ...
 * ]
 */
export const makeSelectCollaboratorsPerProjectForUser = (userId) => createSelector(
  [makeSelectUserProjects(userId), selectTasks, selectUsers, selectUser],
  (myProjects, allTasks, users, user) => {
    const uid = Number(userId);
    const usersById = new Map(users.map(u => [Number(u.id), u]));

    // جمّع مهام كل مشروع
    const tasksByProject = new Map();
    for (const t of allTasks) {
      const pid = Number(t.projectId);
      if (!tasksByProject.has(pid)) tasksByProject.set(pid, []);
      tasksByProject.get(pid).push(t);
    }

    return myProjects.map((p) => {
      const pid = Number(p.id);
      const tasks = tasksByProject.get(pid) || [];

      // هات كل اليوزرات اللي لمسوا مهام المشروع ده (owner/collab)
      const contributorsSet = new Set();
      for (const t of tasks) {
        for (const uidOnTask of usersOnTask(t)) contributorsSet.add(uidOnTask);
      }

      // ضيف أعضاء المشروع كمان (members + leader)
      contributorsSet.add(Number(p.leaderId));
      for (const m of (p.members || [])) contributorsSet.add(Number(m));

      // شيل اليوزر نفسه
      contributorsSet.delete(uid);

      // احسب عدد المهام اللي الشخص ده مشارك فيها داخل المشروع
      const collaborators = Array.from(contributorsSet).map((cid) => {

        const tasksCountWithYou = tasks.filter((t) => usersOnTask(t).includes(cid)).length;
        return {
          user: usersById.get(cid) || { id: cid, name: `#${cid}` },
          tasksCountWithYou,
        };
      });


      // ترتيب بسيط: الأكثر مشاركة أولاً
      collaborators.sort((a, b) => b.tasksCountWithYou - a.tasksCountWithYou);

      return { project: p, collaborators };
    });
  }
);

// /** مهام اليوزر (flat) — موجودة عندك برضه في selectors القديمة، بنكررها هنا للراحة */
// export const makeSelectTasksByUser = (userId) => createSelector(
//   [selectTasks],
//   (tasks) => tasks.filter((t) => Number(t.assignedTo) === Number(userId))
// );