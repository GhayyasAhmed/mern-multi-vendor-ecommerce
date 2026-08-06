import { createSlice } from "@reduxjs/toolkit";

// Circuit breaker for the refresh-token retry loop in apiSlice.ts, lifted
// out of module-level mutable state into the Redux store so it is visible
// in DevTools, resettable between test runs, and safely scoped per store
// instance instead of shared across unrelated requests/module evaluations.
interface SessionState {
  invalid: boolean;
}

const initialState: SessionState = {
  invalid: false,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    markSessionInvalid(state) {
      state.invalid = true;
    },
    markSessionValid(state) {
      state.invalid = false;
    },
  },
});

export const { markSessionInvalid, markSessionValid } = sessionSlice.actions;
export default sessionSlice.reducer;

export const selectSessionInvalid = (state: { session: SessionState }): boolean =>
  state.session.invalid;