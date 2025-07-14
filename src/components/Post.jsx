import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPosts,
  createPostAsync,
  uploadPostImage,
  updatePostAsync,
  deletePostAsync,
  setIsEdit,
} from "../fetures/postSlice";
import { motion } from 'framer-motion';
import { ChatBubbleLeftIcon, TrashIcon, PencilIcon, CheckIcon } from "@heroicons/react/24/outline";
import {
    addCommentAsync,
    fetchCommentsAsync,
    deletePostCommentsAsync
} from '../fetures/commentSlice'


function Post() {
  const [content, setContent] = useState("");
  const [editContent, setEditContent] = useState("");
  const [updateError, setUpdateError] = useState(null);
  const [commentContent, setCommentContent] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentErrors, setCommentErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { user } = useSelector((state)  => state.auth)
  const dispatch = useDispatch();
  const { posts, loading, error } = useSelector((state) => state.posts);
  const { commentsByPost, loading: commentsLoading, error: commentsError } = useSelector((state) => state.comments);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);
  
  useEffect(() => {
    if (posts && posts.length > 0) {
      posts.forEach(post => {
        const postId = post.$id || post.id;
        dispatch(fetchCommentsAsync(postId));
      });
    }
  }, [dispatch, posts]);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = null;

    if (imageFile) {
      try {
        imageUrl = await dispatch(uploadPostImage(imageFile)).unwrap();
        console.log(imageUrl);
        
      } catch (err) {
        alert("Image upload failed: " + err);
        return;
      }
    }
    const newPost = {
      userId: user.$id,
      createdBy: user.name,
      content,
      createdAt: new Date().toISOString(),
      isEditable: false,
      imageUrl,
    };

    dispatch(createPostAsync(newPost))
      .unwrap()
      .then(() => {
        setContent("");
        setImageFile(null);
        setImagePreview(null);
      })
      .catch((err) => {
        console.error("Create post failed:", err);
      });
  };

  const handleEdit = (post) => {
    setEditContent(post.content);
    dispatch(setIsEdit(post));
  };

  const handleUpdate = async (post) => {
    if (editContent.trim()) {
      try {
        setUpdateError(null);
        const postId = post.$id || post.id;

        if (!postId) {
          throw new Error("Post ID not found");
        }

        await dispatch(
          updatePostAsync({
            id: postId,
            data: {
              content: editContent,
              isEditable: false,
            },
          })
        ).unwrap();

        dispatch(fetchPosts());
        setEditContent("");
      } catch (error) {
        setUpdateError(error.message || "Update failed");
        console.error("Update failed:", error);
      }
    }
  };

  // console.log(user.$id);
  

  const handleDelete = (post) => {
    const postId = post.$id || post.id;

    if (!postId) {
      console.error("Cannot delete post: Post ID not found");
      return;
    }
    const postComments = commentsByPost[postId] || [];
    
    dispatch(deletePostAsync({ 
      postId: postId,
      deleteComments: postComments.length > 0
    }))
      .unwrap()
      .then(() => {
        dispatch(fetchPosts());
      })
      .catch((err) => {
        console.error("Delete failed:", err);
      });
  };

  const handleCommentClick = (postId) => {
    setActiveCommentPost(activeCommentPost === postId ? null : postId);
    
    if (activeCommentPost !== postId) {
      dispatch(fetchCommentsAsync(postId))
        .unwrap()
        .catch(err => {
          console.error("Error fetching comments:", err);
          setCommentErrors(prev => ({...prev, [postId]: "Failed to load comments"}));
        });
    }
  };

  const handleAddComment = (postId) => {
    if (commentContent.trim()) {
      setCommentErrors(prev => ({...prev, [postId]: null}));
      
      dispatch(addCommentAsync({
        postId,
        content: commentContent
      }))
        .unwrap()
        .then(() => {
          setCommentContent("");
        })
        .catch(err => {
          console.error("Error adding comment:", err);
          setCommentErrors(prev => ({...prev, [postId]: "Failed to add comment"}));
        });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white mb-8 text-center"
      >
        Social Feed
      </motion.h1>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-gray-700/50 hover:border-gray-600/50 transition-all"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-gray-400 transition-all"
              rows={4}
              maxLength={280}
            />
            <div className="mt-3">
              <label className="block text-gray-400 mb-1">Attach Image (optional):</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files[0])}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 max-h-40 rounded-lg border border-gray-600" />
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className={`text-sm transition-colors ${
                content.length > 240 ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {280 - content.length} characters remaining
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!content.trim() || loading}
                className={`px-6 py-2 rounded-full font-semibold text-white transition-all
                  ${!content.trim() || loading
                    ? "bg-blue-600/50 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/20"
                  }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Posting...
                  </span>
                ) : "Post"}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>

      <div className="space-y-6">
        {posts.map((post, index) => {
          const postId = post.$id || post.id;
          const postComments = commentsByPost[postId] || [];
          
          
          return (
            <motion.div
              key={postId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {post.createdBy?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">{post.createdBy}</h2>
                      <p className="text-sm text-gray-400">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>

                  {post.isEditable ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white"
                      rows={3}
                      maxLength={280}
                    />
                  ) : (
                    <p className="text-gray-200 text-lg">{post.content}</p>
                  )}

                  <div className="flex items-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                      onClick={() => handleCommentClick(postId)}
                    >
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">{postComments.length || 0}</span>
                    </motion.button>

                    {post.userId === user.$id && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(post)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-all"
                          disabled={loading}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </motion.button>
                        
                        {post.isEditable ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleUpdate(post)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-full transition-all"
                            disabled={!editContent.trim() || loading}
                          >
                            <CheckIcon className="h-5 w-5" />
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(post)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full transition-all"
                            disabled={loading}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
              </div>

              {activeCommentPost === postId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 space-y-4"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <button
                      onClick={() => handleAddComment(postId)}
                      disabled={commentsLoading || !commentContent.trim()}
                      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                        commentsLoading || !commentContent.trim() ? "opacity-50" : ""
                      }`}
                    >
                      {commentsLoading ? "Posting..." : "Comment"}
                    </button>
                  </div>
                  
                  
                  {commentErrors[postId] && (
                    <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded">
                      <p>{commentErrors[postId]}</p>
                    </div>
                  )}
                  
                  {commentsLoading && (
                    <div className="text-center py-2 text-gray-400">Loading comments...</div>
                  )}
                  
                  {postComments.length > 0 ? (
                    postComments.map((comment) => (
                      <div key={comment.$id} className="bg-gray-700 p-3 rounded">
                        <p className="text-gray-200">{comment.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : !commentsLoading && (
                    <div className="text-center py-2 text-gray-400">No comments yet</div>
                  )}
                </motion.div>
              )}

              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="mt-4 rounded-lg border border-gray-700 max-h-64 w-auto mx-auto"
                />
              )}
              
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default Post;