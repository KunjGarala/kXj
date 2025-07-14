import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { account } from '../appwrite/config';
import { ID } from 'appwrite';


export const getCurrentSession = createAsyncThunk(
  'auth/getCurrentSession',
  async (_, { rejectWithValue }) => {
    try {
      const session = await account.get();
      return session;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);




export const checkAuthStatus = createAsyncThunk(
    'auth/checkStatus',
    async (_, { rejectWithValue }) => {
        try {
            // console.log("hi nfjnjsn");
            const user = await account.get();
            return { user };
        } catch (error) {
            if (error.code === 401) {
                console.warn("User not logged in");
                return rejectWithValue("Not logged in");
            }
            if (!navigator.onLine) {
                return rejectWithValue({
                    type: 'NETWORK_ERROR',
                    message: 'Network connection unavailable'
                });
            }
            return rejectWithValue({
                type: 'UNKNOWN_ERROR',
                message: error.message
            });
        }
    }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, name }, { rejectWithValue }) => {
    try {
      const newUser = await account.create(ID.unique(), email, password, name);

      await account.createEmailPasswordSession(email, password);

      const user = await account.get();

      return { user };
    } catch (error) {
      if (error?.code === 401) {
        return rejectWithValue('Invalid credentials');
      }
      if (!navigator.onLine) {
        return rejectWithValue('Network connection unavailable');
      }
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, thunkAPI) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      return { user };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await account.deleteSessions();
            return null;
        } catch (error) {
            console.error("Logout error:", error);
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                return null;
            }
            return rejectWithValue(error.message || "Logout failed");
        }
    }
);

const initialState = {
    user: null,
    session: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    networkStatus: 'ONLINE'
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
        setNetworkStatus: (state, action) => {
            state.networkStatus = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkAuthStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
                state.networkStatus = 'ONLINE';
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.loading = false;
                if (action.payload?.type === 'NETWORK_ERROR') {
                    state.networkStatus = 'OFFLINE';
                    state.error = action.payload.message;
                } else {
                    state.user = null;
                    state.isAuthenticated = false;
                    state.error = null;
                    state.networkStatus = 'ONLINE';
                }
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
                state.networkStatus = 'ONLINE';
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Registration failed";
                if (action.payload && action.payload.includes('Network connection unavailable')) {
                    state.networkStatus = 'OFFLINE';
                }
            })
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
                state.networkStatus = 'ONLINE';
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Login failed";
                if (action.payload && action.payload.includes('Network connection unavailable')) {
                    state.networkStatus = 'OFFLINE';
                }
            })
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Logout failed";
            })
            
            

    }
});

export const { clearAuthError, setNetworkStatus } = authSlice.actions;
export default authSlice.reducer;