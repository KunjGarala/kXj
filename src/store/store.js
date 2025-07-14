import { configureStore } from '@reduxjs/toolkit';
import postReducer from '../fetures/postSlice';
import commentReducer from '../fetures/commentSlice';
import authReducer from '../fetures/authSlice';
export const store = configureStore({
    reducer: {
        posts: postReducer,
        comments: commentReducer,
        auth: authReducer,
    }
});;