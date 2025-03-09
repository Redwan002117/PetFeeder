import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';

interface Device {
  id: string;
  name: string;
  userId: string;
  model: string;
  firmwareVersion: string;
  isOnline: boolean;
  lastActive: string;
  foodLevel: number;
  status: 'active' | 'maintenance' | 'disabled';
  settings: {
    feedingSize: number;
    notificationsEnabled: boolean;
  };
}

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'maintenance'>('all');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const devicesSnapshot = await getDocs(collection(db, 'devices'));
      const devicesData = devicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Device[];
      setDevices(devicesData);
    } catch (error) {
      toast.error('Failed to fetch devices');
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDeviceStatus = async (deviceId: string, status: Device['status']) => {
    try {
      await updateDoc(doc(db, 'devices', deviceId), { status });
      toast.success('Device status updated successfully');
      fetchDevices();
    } catch (error) {
      toast.error('Failed to update device status');
      console.error('Error updating device status:', error);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;

    try {
      await deleteDoc(doc(db, 'devices', deviceId));
      toast.success('Device deleted successfully');
      fetchDevices();
    } catch (error) {
      toast.error('Failed to delete device');
      console.error('Error deleting device:', error);
    }
  };

  const triggerFirmwareUpdate = async (deviceId: string) => {
    try {
      await updateDoc(doc(db, 'devices', deviceId), {
        updatePending: true,
        updateRequestedAt: new Date().toISOString()
      });
      toast.success('Firmware update triggered');
    } catch (error) {
      toast.error('Failed to trigger firmware update');
      console.error('Error triggering firmware update:', error);
    }
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDevices = devices.filter(device => {
    switch (filter) {
      case 'online':
        return device.isOnline;
      case 'offline':
        return !device.isOnline;
      case 'maintenance':
        return device.status === 'maintenance';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg font-medium text-gray-900">Device Management</h2>
        <p className="mt-1 text-sm text-gray-500">Monitor and manage all PetFeeder devices</p>
      </div>

      <div className="px-4 py-3 border-b border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Devices</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <button
            onClick={fetchDevices}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Food Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Firmware
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDevices.map((device) => (
              <tr key={device.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                      🤖
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{device.name}</div>
                      <div className="text-sm text-gray-500">ID: {device.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(device.status)}`}>
                      {device.status}
                    </span>
                    <span className={`mt-1 text-xs ${device.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {device.isOnline ? '● Online' : '● Offline'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${device.foodLevel > 20 ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${device.foodLevel}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-500">{device.foodLevel}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Version: {device.firmwareVersion}</div>
                  <button
                    onClick={() => triggerFirmwareUpdate(device.id)}
                    className="mt-1 text-xs text-indigo-600 hover:text-indigo-900"
                  >
                    Check for updates
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={device.status}
                    onChange={(e) => updateDeviceStatus(device.id, e.target.value as Device['status'])}
                    className="mr-3 text-sm border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  <button
                    onClick={() => deleteDevice(device.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 