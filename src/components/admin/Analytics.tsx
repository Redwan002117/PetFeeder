import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalDevices: number;
  activeDevices: number;
  totalFeedings: number;
  averageFoodLevel: number;
  deviceIssues: number;
  feedingsByHour: number[];
  userGrowth: {
    date: string;
    count: number;
  }[];
}

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalDevices: 0,
    activeDevices: 0,
    totalFeedings: 0,
    averageFoodLevel: 0,
    deviceIssues: 0,
    feedingsByHour: Array(24).fill(0),
    userGrowth: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate time range
      const now = new Date();
      let startTime = new Date();
      switch (timeRange) {
        case '24h':
          startTime.setDate(now.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(now.getDate() - 30);
          break;
        case '90d':
          startTime.setDate(now.getDate() - 90);
          break;
      }

      // Fetch users data
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      
      // Fetch active users (users who logged in within the time range)
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastLogin', '>=', startTime)
      );
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      const activeUsers = activeUsersSnapshot.size;

      // Fetch devices data
      const devicesSnapshot = await getDocs(collection(db, 'devices'));
      const devices = devicesSnapshot.docs.map(doc => doc.data());
      const totalDevices = devices.length;
      const activeDevices = devices.filter(device => device.isOnline).length;
      const averageFoodLevel = devices.reduce((acc, device) => acc + (device.foodLevel || 0), 0) / totalDevices;
      const deviceIssues = devices.filter(device => device.status === 'maintenance').length;

      // Fetch feedings data
      const feedingsQuery = query(
        collection(db, 'feeding_logs'),
        where('timestamp', '>=', Timestamp.fromDate(startTime))
      );
      const feedingsSnapshot = await getDocs(feedingsQuery);
      const feedings = feedingsSnapshot.docs.map(doc => doc.data());
      const totalFeedings = feedings.length;

      // Calculate feedings by hour
      const feedingsByHour = Array(24).fill(0);
      feedings.forEach(feeding => {
        const hour = new Date(feeding.timestamp.seconds * 1000).getHours();
        feedingsByHour[hour]++;
      });

      // Calculate user growth
      const userGrowth = await calculateUserGrowth(startTime);

      setData({
        totalUsers,
        activeUsers,
        totalDevices,
        activeDevices,
        totalFeedings,
        averageFoodLevel,
        deviceIssues,
        feedingsByHour,
        userGrowth
      });
    } catch (error) {
      toast.error('Failed to fetch analytics data');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserGrowth = async (startTime: Date) => {
    const usersQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(startTime))
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      createdAt: doc.data().createdAt.seconds * 1000
    }));

    const growth: { [key: string]: number } = {};
    users.forEach(user => {
      const date = new Date(user.createdAt).toISOString().split('T')[0];
      growth[date] = (growth[date] || 0) + 1;
    });

    return Object.entries(growth).map(([date, count]) => ({ date, count }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Analytics Overview</h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{data.totalUsers}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {data.activeUsers} active
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🤖</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Devices</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{data.totalDevices}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {data.activeDevices} online
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🍽️</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Feedings</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{data.totalFeedings}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Device Issues</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{data.deviceIssues}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-yellow-600">
                      Needs attention
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Feedings by Hour */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feedings by Hour</h3>
          <div className="h-64">
            <div className="flex h-full items-end space-x-2">
              {data.feedingsByHour.map((count, hour) => (
                <div
                  key={hour}
                  className="flex-1 bg-indigo-100 hover:bg-indigo-200 transition-colors duration-150"
                  style={{
                    height: `${(count / Math.max(...data.feedingsByHour)) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`${hour}:00 - ${count} feedings`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
          <div className="h-64">
            <div className="flex h-full items-end space-x-2">
              {data.userGrowth.map(({ date, count }) => (
                <div
                  key={date}
                  className="flex-1 bg-green-100 hover:bg-green-200 transition-colors duration-150"
                  style={{
                    height: `${(count / Math.max(...data.userGrowth.map(d => d.count))) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`${date} - ${count} new users`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{data.userGrowth[0]?.date}</span>
              <span>{data.userGrowth[data.userGrowth.length - 1]?.date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 