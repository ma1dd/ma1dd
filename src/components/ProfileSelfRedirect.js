import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileSelfRedirect = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  return <Navigate to={`/profile/${currentUser.id}`} replace />;
};

export default ProfileSelfRedirect;

