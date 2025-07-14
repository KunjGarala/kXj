// Keep track of already fetched post IDs to avoid duplicate requests
let fetchedPostIds = new Set();
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { databases } from '../appwrite/config';
import { Query } from 'appwrite';
import { v4 as uuidv4 } from "uuid";

// Action to delete all comments for a specific post
export const deletePostCommentsAsync = createAsyncThunk(
    'comments/deletePostComments',
    async (postId, { rejectWithValue, getState }) => {
        try {
            // Get existing comments for this post
            const state = getState();
            const existingComments = state.comments.commentsByPost[postId] || [];
            
            // Delete each comment
            const deletePromises = existingComments.map(comment => {
                const commentId = comment.$id;
                return databases.deleteDocument(
                    import.meta.env.VITE_DATABASE_ID,
                    import.meta.env.VITE_APPWRITE_COLLECTION_ID_COMMENT,
                    commentId
                );
            })
            .addCase(deletePostCommentsAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePostCommentsAsync.fulfilled, (state, action) => {
                state.loading = false;
                const postId = action.payload;
                
                // Remove all comments for this post from the state
                delete state.commentsByPost[postId];
                state.error = null;
            })
            .addCase(deletePostCommentsAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message || "Failed to delete comments";
            });
            
            // Wait for all deletions to complete
            await Promise.all(deletePromises);
            
            // Clean up the cache
            fetchedPostIds.delete(postId);
            
            return postId;
        } catch (error) {
            console.error("Error deleting post comments:", error);
            return rejectWithValue(error.message || "Failed to delete comments");
        }
    }
);

export const fetchCommentsAsync = createAsyncThunk(
    'comments/fetchComments',
    async (postId, { getState }) => {
        try {
            const state = getState();
            const existingComments = state.comments.commentsByPost[postId];
            
            if (!fetchedPostIds.has(postId) || !existingComments) {
                const response = await databases.listDocuments(
                    import.meta.env.VITE_DATABASE_ID,
                    import.meta.env.VITE_APPWRITE_COLLECTION_ID_COMMENT,
                    [
                        Query.equal('postId', postId),
                        Query.orderDesc('createdAt')
                    ]
                );
                fetchedPostIds.add(postId);
                
                return {
                    postId,
                    comments: response.documents
                };
            }
            return { 
                postId,
                comments: existingComments || []
            };
        } catch (error) {
            console.error("Error fetching comments:", error);
            throw error;
        }
    }
);

export const addCommentAsync = createAsyncThunk(
    'comments/addComment',
    async ({ postId, content }, { rejectWithValue, dispatch }) => {
        try {
            const commentId = uuidv4();
            
            const commentData = {
                content,
                postId,
                createdAt: new Date().toISOString()
            };
            
            const response = await databases.createDocument(
                import.meta.env.VITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_COLLECTION_ID_COMMENT,
                commentId,
                commentData
            );
            
            const newComment = {
                ...response,
                postId 
            };
            
            fetchedPostIds.delete(postId); 

            return newComment;
        } catch (error) {
            console.error("Error adding comment:", error);
            return rejectWithValue(error.message || "Failed to add comment");
        }
    }
);

const commentSlice = createSlice({
    name: 'comments',
    initialState: {
        commentsByPost: {},
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCommentsAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCommentsAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.commentsByPost[action.payload.postId] = action.payload.comments;
                state.error = null;
            })
            .addCase(fetchCommentsAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch comments";
            })
            .addCase(addCommentAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addCommentAsync.fulfilled, (state, action) => {
                state.loading = false;
                const comment = action.payload;
                const postId = comment.postId;
                
                if (!state.commentsByPost[postId]) {
                    state.commentsByPost[postId] = [];
                }
                
                state.commentsByPost[postId].unshift(comment);
                state.error = null;
                fetchedPostIds.add(postId);
            })
            .addCase(addCommentAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message || "Failed to add comment";
            });
    }
});

export default commentSlice.reducer;