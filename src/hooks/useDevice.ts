import { useDevices } from '@/contexts/DeviceContext';

/**
 * Legacy hook that redirects to the new useDevices hook
 * This allows backwards compatibility with old components
 */
export function useDevice() {
  console.warn('useDevice() is deprecated, please use useDevices() instead');
  return useDevices();
}

export default useDevice;
