// src/components/Navbar.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../fetures/authSlice';
import { motion } from 'framer-motion';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  
  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        navigate('/login');
      })
      .catch((err) => {
        console.error("Logout failed:", err);
      });
  };
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center"
          >
            <Link to="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                k X j
              </span>
            </Link>
          </motion.div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2 bg-gray-700/50 py-2 px-4 rounded-full">
                  <UserCircleIcon className="h-5 w-5 text-gray-300" />
                  <p className="text-gray-300">
                    Hello, <span className="font-medium text-white">{user?.name || 'User'}</span>
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex items-center space-x-2 py-2 px-4 bg-red-600/90 hover:bg-red-700 
                    text-white rounded-full transition-colors disabled:opacity-50 shadow-lg 
                    hover:shadow-red-500/20"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>{loading ? 'Logging out...' : 'Logout'}</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-x-4"
              >
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className="inline-flex items-center py-2 px-4 bg-gray-700/90 text-white 
                      rounded-full hover:bg-gray-600 transition-colors shadow-lg 
                      hover:shadow-gray-500/20"
                  >
                    Login
                  </Link>
                </motion.span>
                
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="inline-flex items-center py-2 px-4 bg-blue-600/90 text-white 
                      rounded-full hover:bg-blue-700 transition-colors shadow-lg 
                      hover:shadow-blue-500/20"
                  >
                    Register
                  </Link>
                </motion.span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;