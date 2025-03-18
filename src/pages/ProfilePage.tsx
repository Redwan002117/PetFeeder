import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Your Profile</h1>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
        <div className='mb-6 flex items-center'>
          <div className='h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl text-gray-600'>
            {user?.name?.[0] || user?.email?.[0]}
          </div>
          <div className='ml-4'>
            <h2 className='text-xl font-bold'>{user?.name || 'User'}</h2>
            <p className='text-gray-600 dark:text-gray-300'>{user?.email}</p>
          </div>
        </div>
        
        <div className='mb-6'>
          <h3 className='text-lg font-semibold mb-3'>Account Information</h3>
          <div className='mb-2'>
            <span className='text-gray-500 dark:text-gray-400'>Email:</span> {user?.email}
          </div>
          <div className='mb-2'>
            <span className='text-gray-500 dark:text-gray-400'>Member since:</span> March 2024
          </div>
        </div>
        
        <div className='mb-6'>
          <h3 className='text-lg font-semibold mb-3'>Connected Devices</h3>
          <div className='mb-2'>
            <span className='text-gray-500 dark:text-gray-400'>Device 1:</span> Kitchen Pet Feeder
            <span className='ml-3 text-green-500 text-sm'>Online</span>
          </div>
        </div>
        
        <div className='flex mt-8'>
          <button className='bg-blue-500 text-white py-2 px-4 rounded mr-3'>
            Edit Profile
          </button>
          <button 
            className='bg-red-500 text-white py-2 px-4 rounded'
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
