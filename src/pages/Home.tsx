import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Mail, Github, Linkedin, Heart, PawPrint, CheckCircle, ArrowRight, Clock, Bell, Shield, Smartphone } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import ProfileAvatar from '@/components/ProfileAvatar';
import { motion } from 'framer-motion';
import { getDeviceStatus, getDevices, getLastFeeding } from '@/lib/home-utils';
import { toast } from "sonner";

function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<any>(null);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [lastFeeding, setLastFeeding] = useState<any>(null);
  const [nextScheduledFeeding, setNextScheduledFeeding] = useState<string | null>(null);
  const [scheduledFeedings, setScheduledFeedings] = useState<number>(0);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  // Fetch device data when user is logged in
  useEffect(() => {
    if (!currentUser) return;

    const fetchDeviceData = async () => {
      setLoading(true);
      try {
        const devices = await getDevices(currentUser.id);
        setDevices(devices);

        if (devices.length > 0) {
          const status = await getDeviceStatus(devices[0].id);
          const lastFeeding = await getLastFeeding(devices[0].id);
          setDeviceStatus(status);
          setLastFeeding(lastFeeding);
        }
      } catch (error) {
        console.error('Error fetching device data:', error);
        toast.error('Failed to fetch device data');
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('device_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          // Update device data when changes occur
          setDevices(current => 
            current.map(device => 
              device.id === payload.new.id ? { ...device, ...payload.new } : device
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser, toast]);

  // Format the last active time
  const formatLastActive = (timestamp: string) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };

  // Format the last feeding time
  const formatLastFeeding = () => {
    if (!lastFeeding) return 'No recent feedings';
    
    try {
      const date = new Date(lastFeeding.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Unknown';
    }
  };

  // If user is logged in, show a dashboard-like home page
  if (currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <PawPrint className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </motion.div>
              <motion.h1 
                className="text-2xl font-bold text-gray-900 dark:text-white"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                PetFeeder
              </motion.h1>
            </div>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-4"
              >
                <Button 
                  variant="ghost" 
                  className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </Button>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ProfileAvatar user={currentUser} size="sm" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </header>

        <motion.main 
          className="container mx-auto px-4 py-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="text-center mb-16"
            variants={itemVariants}
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Welcome Back, <span className="text-indigo-600 dark:text-indigo-400">{currentUser.displayName || 'Pet Lover'}</span>!
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Your pet's feeding schedule is just a tap away. What would you like to do today?
            </motion.p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-gray-800"
                  onClick={() => navigate('/schedule')}
                >
                  Manage Feeding Schedule
                  <Clock className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
            variants={containerVariants}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Recent Activity</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {deviceLoading ? (
                  "Loading feeding information..."
                ) : (
                  <>
                    Your pet was last fed today at {formatLastFeeding()}. 
                    {nextScheduledFeeding && (
                      <> The next scheduled feeding is at {nextScheduledFeeding}.</>
                    )}
                  </>
                )}
              </p>
              <Button 
                variant="ghost" 
                className="text-indigo-600 dark:text-indigo-400 p-0 hover:bg-transparent hover:text-indigo-800 dark:hover:text-indigo-300"
                onClick={() => navigate('/statistics')}
              >
                View Feeding History
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Feeding Schedule</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {deviceLoading ? (
                  "Loading schedule information..."
                ) : (
                  <>
                    You have {scheduledFeedings} scheduled feedings set up for today. Manage your pet's feeding schedule with ease.
                  </>
                )}
              </p>
              <Button 
                variant="ghost" 
                className="text-green-600 dark:text-green-400 p-0 hover:bg-transparent hover:text-green-800 dark:hover:text-green-300"
                onClick={() => navigate('/schedule')}
              >
                Manage Schedule
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Device Status</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {deviceLoading ? (
                  "Loading device information..."
                ) : (
                  <>
                    Your PetFeeder device is {deviceStatus?.isOnline ? 'online' : 'offline'} and 
                    {deviceStatus?.isOnline ? ' functioning properly' : ' needs attention'}. 
                    Food level is at {deviceStatus?.foodLevel || 0}%.
                    {!deviceStatus?.isOnline && (
                      <> Last active: {formatLastActive(deviceStatus?.lastActive)}.</>
                    )}
                  </>
                )}
              </p>
              <Button 
                variant="ghost" 
                className="text-amber-600 dark:text-amber-400 p-0 hover:bg-transparent hover:text-amber-800 dark:hover:text-amber-300"
                onClick={() => navigate('/connectivity')}
              >
                Check Device Status
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="flex flex-col md:flex-row items-center justify-between gap-12 mb-24"
            variants={fadeInVariants}
          >
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                Control Your Pet's Feeding From Anywhere
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our smart pet feeder allows you to feed your pet remotely using your smartphone or computer. 
                Set up feeding schedules, control portion sizes, and receive notifications when your pet has been fed.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Remote feeding with just a tap</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Customizable feeding schedules</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Real-time notifications</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Feeding history and analytics</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <motion.div 
                className="relative rounded-lg overflow-hidden shadow-xl"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <img 
                  src="/pet-feeder-device.svg" 
                  alt="PetFeeder Device" 
                  className="w-full h-auto"
                  onError={(e) => {
                    setImageError(true);
                    e.currentTarget.src = '/default-device-image.svg';
                  }}
                />
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="text-center p-6">
                      <PawPrint size={64} className="mx-auto mb-4 text-indigo-500" />
                      <p className="text-gray-600 dark:text-gray-400">Pet Feeder Device</p>
          </div>
        </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.main>
      </div>
    );
  }

  // If user is not logged in, show the landing page
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <PawPrint className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <motion.h1 
              className="text-2xl font-bold text-gray-900 dark:text-white"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              PetFeeder
            </motion.h1>
          </div>
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              variant="ghost" 
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="default" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </header>

      <motion.main 
        className="container mx-auto px-4 py-12"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Smart Pet Feeding <span className="text-indigo-600 dark:text-indigo-400">Made Simple</span>
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Never worry about your pet's feeding schedule again. Control your pet feeder remotely, 
            set schedules, and monitor your pet's feeding habits from anywhere.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => navigate('/register')}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-gray-800"
                onClick={() => navigate('/documentation')}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24"
          variants={fadeInVariants}
        >
          <motion.div 
            className="order-2 md:order-1"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Control Your Pet's Feeding From Anywhere
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Our smart pet feeder allows you to feed your pet remotely using your smartphone or computer. 
              Set up feeding schedules, control portion sizes, and receive notifications when your pet has been fed.
            </p>
            <ul className="space-y-4">
              <motion.li 
                className="flex items-start"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Remote feeding with just a tap</span>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Customizable feeding schedules</span>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Real-time notifications</span>
              </motion.li>
              <motion.li 
                className="flex items-start"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Feeding history and analytics</span>
              </motion.li>
            </ul>
            <motion.div 
              className="mt-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => navigate('/register')}
              >
                Sign Up Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="order-1 md:order-2"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.03 }}
          >
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <img 
                src="/pet-feeder-device.svg" 
                alt="PetFeeder Device" 
                className="w-full h-auto"
                onError={(e) => {
                  setImageError(true);
                  e.currentTarget.src = '/default-device-image.svg';
                }}
              />
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="text-center p-6">
                    <PawPrint size={64} className="mx-auto mb-4 text-indigo-500" />
                    <p className="text-gray-600 dark:text-gray-400">Pet Feeder Device</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mb-24"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900 dark:text-white">
            Why Choose <span className="text-indigo-600 dark:text-indigo-400">PetFeeder</span>?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Scheduled Feeding</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Set up automatic feeding schedules for your pets, ensuring they're fed on time, every time.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Remote Control</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Control your pet feeder from anywhere using our mobile-friendly web application.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              whileHover={{ y: -5 }}
            >
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Peace of Mind</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get notifications when your pet is fed and monitor their feeding patterns with detailed analytics.
              </p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-indigo-600 dark:bg-indigo-800 rounded-2xl p-8 md:p-12 text-white mb-24"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-indigo-100 max-w-2xl mx-auto">
              Join thousands of pet owners who trust PetFeeder to keep their pets fed on schedule.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-indigo-600 hover:bg-indigo-500"
                onClick={() => navigate('/register')}
              >
                Sign Up Free
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-indigo-600 hover:bg-indigo-500"
                onClick={() => navigate('/documentation')}
              >
                Learn More
              </Button>
            </motion.div>
        </div>
        </motion.div>
        
        <motion.div 
          className="mt-24 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Contact the Developer</h2>
          <div className="flex justify-center space-x-6 mb-8">
            <motion.a 
              href="mailto:GamerNo002117@redwancodes.com" 
              className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <Mail size={24} />
            </motion.a>
            <motion.a 
              href="https://github.com/redwan002117" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <Github size={24} />
            </motion.a>
            <motion.a 
              href="https://linkedin.com/in/gamerno002117" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <Linkedin size={24} />
            </motion.a>
      </div>
          <motion.p 
            className="text-gray-600 dark:text-gray-400 flex items-center justify-center"
            animate={{ 
              scale: [1, 1.1, 1],
              transition: { 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 2 
              }
            }}
          >
            Made with <Heart size={16} className="mx-1 text-red-500" /> by Redwan
          </motion.p>
        </motion.div>
      </motion.main>
    </div>
  );
}

export default Home;