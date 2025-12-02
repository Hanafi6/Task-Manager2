// // src/services/apiSlice.js
// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// export const api = createApi({
//     reducerPath: 'api',
//     baseQuery: fetchBaseQuery({
//         baseUrl: 'http://localhost:3000/',
//         prepareHeaders: (headers) => {
//             // أثناء التطوير نمنع كاش المتصفح (json-server / tinyhttp)
//             headers.set('Cache-Control', 'no-cache');
//             headers.set('Pragma', 'no-cache');
//             return headers;
//         },
//     }),
//     tagTypes: ['Notifications'],
//     endpoints: (builder) => ({
//         // --------- GET Notifications ----------
//         getNotifications: builder.query({
//             query: () => 'notifications',
//             // كل notification يأخد tag حسب id + قائمة LIST
//             providesTags: (result) =>
//                 result
//                     ? [
//                         ...result.map((n) => ({ type: 'Notifications', id: n.id })),
//                         { type: 'Notifications', id: 'LIST' },
//                     ]
//                     : [{ type: 'Notifications', id: 'LIST' }],
//             // لا تغيّر keepUnusedDataFor هنا؛ عشان تقدر تستخدم polling أو refetchOptions عند الاستدعاء
//             // keepUnusedDataFor: 60,
//         }),

//         // --------- CREATE Notification ----------
//         createNotification: builder.mutation({
//             query: (payload) => ({
//                 url: 'notifications',
//                 method: 'POST',
//                 body: payload,
//             }),
//             // بعد الكتابة نعلم أن LIST تغير -> سيؤدي لإعادة جلب لو هناك subscribers
//             invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
//             // optimistic update + rollback
//             async onQueryStarted(arg, { dispatch, queryFulfilled }) {
//                 // optimistic: أضف العنصر مؤقتًا إلى كاش getNotifications
//                 const patchResult = dispatch(
//                     api.util.updateQueryData('getNotifications', undefined, (draft) => {
//                         // افتراض: draft مصفوفة
//                         draft.unshift({ ...arg });
//                     })
//                 );
//                 try {
//                     const { data } = await queryFulfilled;
//                     // ممكن نؤكد/نستبدل الـ optimistic entry بـ server response
//                     dispatch(
//                         api.util.updateQueryData('getNotifications', undefined, (draft) => {
//                             // استبدل العنصر الذي يحمل نفس id إن وُجد، وإلا أتركه
//                             const idx = draft.findIndex((d) => String(d.id) === String(data.id));
//                             if (idx !== -1) draft[idx] = data;
//                             else draft.unshift(data);
//                         })
//                     );
//                 } catch {
//                     // rollback on error
//                     patchResult.undo();
//                 }
//             },
//         }),

//         // --------- UPDATE Notification (mark read / dismiss) ----------
//         updateNotification: builder.mutation({
//             query: ({ id, data }) => ({
//                 url: `notifications/${id}`,
//                 method: 'PUT',
//                 body: data,
//             }),
//             // بعد التحديث نحدّث الـ item والـ LIST
//             invalidatesTags: (result, error, arg) => [
//                 { type: 'Notifications', id: arg.id },
//                 { type: 'Notifications', id: 'LIST' },
//             ],
//             async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
//                 // optimistic patch: حدّث العنصر في الكاش فوراً
//                 const patchResult = dispatch(
//                     api.util.updateQueryData('getNotifications', undefined, (draft) => {
//                         const i = draft.findIndex((d) => String(d.id) === String(id));
//                         if (i !== -1) {
//                             draft[i] = { ...draft[i], ...data };
//                         }
//                     })
//                 );
//                 try {
//                     await queryFulfilled;
//                 } catch {
//                     patchResult.undo();
//                 }
//             },
//         }),

//         // --------- DELETE Notification (اختياري) ----------
//         deleteNotification: builder.mutation({
//             query: (id) => ({
//                 url: `notifications/${id}`,
//                 method: 'DELETE',
//             }),
//             invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
//             async onQueryStarted(id, { dispatch, queryFulfilled }) {
//                 const patchResult = dispatch(
//                     api.util.updateQueryData('getNotifications', undefined, (draft) => {
//                         const idx = draft.findIndex((d) => String(d.id) === String(id));
//                         if (idx !== -1) draft.splice(idx, 1);
//                     })
//                 );
//                 try {
//                     await queryFulfilled;
//                 } catch {
//                     patchResult.undo();
//                 }
//             },
//         }),
//     }),
// });

// // exported hooks
// export const {
//     useGetNotificationsQuery,
//     useCreateNotificationMutation,
//     useUpdateNotificationMutation,
//     useDeleteNotificationMutation,
// } = api;
