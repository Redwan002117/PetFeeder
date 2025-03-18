import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Settings</h1>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>Device Settings</h2>
        <form>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Device Name</label>
            <input
              type='text'
              className='w-full p-2 border rounded'
              defaultValue='Kitchen Pet Feeder'
            />
          </div>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Time Zone</label>
            <select className='w-full p-2 border rounded'>
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
              <option>Pacific Time (PT)</option>
            </select>
          </div>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Portion Size</label>
            <select className='w-full p-2 border rounded'>
              <option>Small (1/4 cup)</option>
              <option>Medium (1/2 cup)</option>
              <option>Large (3/4 cup)</option>
              <option>Extra Large (1 cup)</option>
            </select>
          </div>
          <div className='mb-4 flex items-center'>
            <input type='checkbox' id='notifications' className='mr-2' />
            <label htmlFor='notifications'>Enable Notifications</label>
          </div>
          <button type='submit' className='bg-primary text-white py-2 px-4 rounded'>
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
