import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Welcome to Pet Feeder</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Recent Feedings</h2>
          <p>No recent feedings recorded.</p>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Food Level</h2>
          <div className='h-4 w-full bg-gray-200 rounded-full'>
            <div className='h-4 bg-primary rounded-full' style={{ width: '75%' }}></div>
          </div>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>75% remaining</p>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Device Status</h2>
          <p className='text-green-500'>Online</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
