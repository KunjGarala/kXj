import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { checkAuthStatus } from '../fetures/authSlice';
import { account } from '../appwrite/config';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get();
        if (!user) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Session check failed:', error);
        navigate('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      // console.log('ProtectedRoute - Checking auth status');
      dispatch(checkAuthStatus())
        .unwrap()
        .then((userData) => {
          // console.log('Auth check success:', userData);
          setIsChecking(false);
        })
        .catch((error) => {
          // console.log('Auth check failed:', error);
          setIsChecking(false);
        });
    } else {

      setIsChecking(false);
      // console.log('ProtectedRoute - Already authenticated:', user);
    }
  }, [dispatch, isAuthenticated, user]);
  

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }
  

  if (!isAuthenticated) {
    // console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // console.log('ProtectedRoute - Rendering protected content');
  return children;
};

export default ProtectedRoute;