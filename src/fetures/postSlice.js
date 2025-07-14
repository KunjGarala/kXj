import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { databases, storage } from '../appwrite/config';
import { Query, ID, Permission, Role } from 'appwrite';
import { deletePostCommentsAsync } from "./commentSlice";



export const fetchPosts = createAsyncThunk(
    'posts/fetchPosts',
    async () => {
        try {
            const response = await databases.listDocuments(
                import.meta.env.VITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_COLLECTION_ID_POST,
                [
                  Query.orderDesc('createdAt')
                ]
            );
            
            return response.documents.map(doc => ({
                ...doc,
                id: doc.$id
            }));
        } catch (error) {
            console.error("Error fetching posts:", error);
            throw error;
        }
    }
);
export const uploadPostImage = createAsyncThunk(
  'posts/uploadPostImage',
  async (file, { rejectWithValue }) => {
    try {
      const uploaded = await storage.createFile(
        import.meta.env.VITE_BUCKET_ID,
        ID.unique(),
        file,
      );
      
      const fileUrl = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_BUCKET_ID}/files/${uploaded.$id}/view?project=6824233c000127fafed7&mode=admin`;
      
      return fileUrl;
    } catch (error) {
      console.error("Image upload failed:", error);
      return rejectWithValue(error.message || "Failed to upload image");
    }
  }
);

export const createPostAsync = createAsyncThunk(
    'posts/createPost',
    async (postData, { rejectWithValue }) => {
        try {
            const documentId = uuidv4();
            
            const postWithId = {
                ...postData,
                id: documentId
            };
            
            const response = await databases.createDocument(
                import.meta.env.VITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_COLLECTION_ID_POST,
                documentId,
                postWithId
            );
            
            return response;
        } catch (error) {
            console.error("Error creating post:", error);
            return rejectWithValue(error.message || "Failed to create post");
        }
    }
);
export const updatePostAsync = createAsyncThunk(
    'posts/updatePost',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            if (!id) {
                throw new Error("Post ID is required for update");
            }
            
            const response = await databases.updateDocument(
                import.meta.env.VITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_COLLECTION_ID_POST,
                id,
                data
            );
            
            return response;
        } catch (error) {
            console.error("Error updating post:", error);
            return rejectWithValue(error.message || "Failed to update post");
        }
    }
);




export const deletePostAsync = createAsyncThunk(
    'posts/deletePost',
    async ({ postId, deleteComments }, { rejectWithValue, dispatch }) => {
        try {
            if (!postId) {
                throw new Error("Post ID is required for deletion");
            }
            if (deleteComments) {
                try {
                    await dispatch(deletePostCommentsAsync(postId)).unwrap();
                } catch (error) {
                    console.error("Error deleting post comments:", error);
                }
            }
            await databases.deleteDocument(
                import.meta.env.VITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_COLLECTION_ID_POST,
                postId
            );
            
            return postId;
        } catch (error) {
            console.error("Error deleting post:", error);
            return rejectWithValue(error.message || 'Delete failed');
        }
    }
);

const initialState = {
    posts: [],
    loading: false,
    error: null
};

const postSlice = createSlice({
    name: "posts",
    initialState,
    reducers: {
        setIsEdit: (state, action) => {
            const post = action.payload;
            const postId = post.$id ;
            
            state.posts = state.posts.map(p => ({
                ...p,
                isEditable: (p.$id === postId ) ? !p.isEditable : false
            }));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPosts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPosts.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = action.payload;
                state.error = null;
            })
            .addCase(fetchPosts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch posts';
            })
            .addCase(createPostAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPostAsync.fulfilled, (state, action) => {
                state.loading = false;
                const newPost = {
                    ...action.payload,
                    id: action.payload.$id
                };
                state.posts.unshift(newPost);
                state.error = null;
            })
            .addCase(createPostAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message || 'Failed to create post';
            })
            .addCase(updatePostAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePostAsync.fulfilled, (state, action) => {
                state.loading = false;
                const updatedId = action.payload.$id || action.payload.id;
                
                state.posts = state.posts.map(post => 
                    (post.$id === updatedId || post.id === updatedId) 
                        ? { ...post, ...action.payload, id: updatedId }
                        : post
                );
                state.error = null;
            })
            .addCase(updatePostAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message || 'Failed to update post';
            })
            .addCase(deletePostAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePostAsync.fulfilled, (state, action) => {
                state.loading = false;
                const deletedId = action.payload;
                state.posts = state.posts.filter(post => 
                    post.$id !== deletedId && post.id !== deletedId
                );
                state.error = null;
            })
            .addCase(deletePostAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message || 'Failed to delete post';
            });
    }
});

export const { setIsEdit } = postSlice.actions;
export default postSlice.reducer;