import { createSlice } from "@reduxjs/toolkit";

const Modals = createSlice({
    name: "modals",
    initialState: {
        OpenDatilsDeleteProject: false,
    },
    reducers: {
        setOpenDiitailsDelete(state, action) {
            state.OpenDatilsDeleteProject = action.payload;
        },
    },
});


export const { setOpenDiitailsDelete } = Modals.actions;
export default Modals.reducer;