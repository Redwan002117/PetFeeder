import React from 'react';

const FeedingSchedulePage: React.FC = () => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Feeding Schedule</h1>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>Current Schedule</h2>
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead>
              <tr>
                <th className='px-4 py-2 text-left'>Time</th>
                <th className='px-4 py-2 text-left'>Amount</th>
                <th className='px-4 py-2 text-left'>Days</th>
                <th className='px-4 py-2 text-left'>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='border px-4 py-2'>8:00 AM</td>
                <td className='border px-4 py-2'>1/2 cup</td>
                <td className='border px-4 py-2'>Mon, Tue, Wed, Thu, Fri</td>
                <td className='border px-4 py-2'>
                  <button className='text-blue-500 mr-2'>Edit</button>
                  <button className='text-red-500'>Delete</button>
                </td>
              </tr>
              <tr>
                <td className='border px-4 py-2'>6:00 PM</td>
                <td className='border px-4 py-2'>1/2 cup</td>
                <td className='border px-4 py-2'>Mon, Tue, Wed, Thu, Fri</td>
                <td className='border px-4 py-2'>
                  <button className='text-blue-500 mr-2'>Edit</button>
                  <button className='text-red-500'>Delete</button>
                </td>
              </tr>
              <tr>
                <td className='border px-4 py-2'>9:00 AM</td>
                <td className='border px-4 py-2'>3/4 cup</td>
                <td className='border px-4 py-2'>Sat, Sun</td>
                <td className='border px-4 py-2'>
                  <button className='text-blue-500 mr-2'>Edit</button>
                  <button className='text-red-500'>Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button className='mt-6 bg-primary text-white py-2 px-4 rounded'>Add New Schedule</button>
      </div>
    </div>
  );
};

export default FeedingSchedulePage;
