import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Home, Calendar, Bell, Settings, History, PieChart, Lock, Share, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export const UserGuide = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          This guide covers all the basic operations and features available to regular users of the PetFeeder system.
        </AlertDescription>
      </Alert>

      <div>
        <h2 className="text-2xl font-bold mb-4">User Guide</h2>
        <p className="text-gray-700 mb-6">
          Welcome to the PetFeeder Hub! This guide will help you understand how to use the web application
          to manage your pet's feeding schedule and monitor their feeding activity.
        </p>
      </div>

      {/* Table of Contents */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex items-center mb-2">
          <Menu className="mr-2 h-5 w-5" />
          <h3 className="text-lg font-semibold">Table of Contents</h3>
        </div>
        <nav className="space-y-1">
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'getting-started' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('getting-started')}
          >
            <Home className="mr-2 h-4 w-4" />
            Getting Started
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'dashboard' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('dashboard')}
          >
            <PieChart className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'scheduling' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('scheduling')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Scheduling
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'history' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('history')}
          >
            <History className="mr-2 h-4 w-4" />
            Feeding History
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'notifications' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('notifications')}
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'settings' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="getting-started" id="getting-started">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <Home className="mr-2 h-5 w-5" />
              <span>Getting Started</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Initial Setup</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Power on your PetFeeder device</li>
              <li>Connect to the "PetFeeder-Setup" WiFi network</li>
              <li>Follow the configuration portal instructions</li>
              <li>Enter your home WiFi credentials</li>
              <li>Wait for the device to connect and register</li>
            </ol>

            <h3 className="text-lg font-semibold mt-4">Device Placement</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Place on a flat, stable surface</li>
              <li>Keep away from water and moisture</li>
              <li>Ensure good WiFi coverage</li>
              <li>Keep power cord safely tucked away</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dashboard">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              <span>Dashboard Overview</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Dashboard Features</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Device Status:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Connection status</li>
                  <li>Food level indicator</li>
                  <li>Last feeding time</li>
                  <li>Next scheduled feeding</li>
                </ul>
              </li>
              <li><strong>Quick Actions:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Manual feed button</li>
                  <li>Schedule management</li>
                  <li>Device settings</li>
                </ul>
              </li>
              <li><strong>Feeding History:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Recent feeding events</li>
                  <li>Success/failure indicators</li>
                  <li>Portion sizes</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Navigation</h3>
            <p>The main navigation menu provides access to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Dashboard (Home)</li>
              <li>Feeding Schedule</li>
              <li>History & Statistics</li>
              <li>Device Settings</li>
              <li>User Profile</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="feeding-schedule">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              <span>Feeding Schedule</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Setting Up Schedules</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Navigate to the Schedules page</li>
              <li>Click "Add New Schedule"</li>
              <li>Set the time and portion size</li>
              <li>Enable/disable as needed</li>
            </ol>

            <h3 className="text-lg font-semibold mt-4">Schedule Management</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Up to 5 schedules per device</li>
              <li>Schedules persist even without internet</li>
              <li>Edit or delete existing schedules</li>
              <li>View schedule history</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="manual-feeding">
          <AccordionTrigger className="text-lg font-medium">Manual Feeding</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Through the Web Dashboard</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Navigate to the Device Control page</li>
              <li>Choose the feed amount (Small, Medium, Large)</li>
              <li>Click the "Feed Now" button</li>
            </ol>

            <h3 className="text-lg font-semibold mt-4">Using the Physical Button</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Press the manual feed button on the device</li>
              <li>Default amount is set to medium</li>
              <li>Wait 10 seconds between feeds</li>
            </ul>

            <div className="bg-yellow-50 p-4 rounded-md mt-4">
              <p className="text-sm text-yellow-800">
                Note: There is a 10-second cooldown period between feeds to prevent overfeeding.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notifications">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              <span>Notifications</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Settings</h3>
            <p>Configure notifications in your profile settings:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Email Notifications:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Low food alerts</li>
                  <li>Feeding confirmation</li>
                  <li>Device offline alerts</li>
                  <li>Schedule changes</li>
                </ul>
              </li>
              <li><strong>Push Notifications:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Real-time feeding alerts</li>
                  <li>Device status updates</li>
                  <li>Error notifications</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Managing Alerts</h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Go to Profile Settings</li>
              <li>Select "Notification Preferences"</li>
              <li>Choose notification types</li>
              <li>Set notification frequency</li>
              <li>Save preferences</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="device-connectivity">
          <AccordionTrigger className="text-lg font-medium">Device Connectivity</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Connection Status</h3>
            <p>Monitor your device's connection:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Status Indicators:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Green: Online and working</li>
                  <li>Yellow: Connected but issues detected</li>
                  <li>Red: Offline or error</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Troubleshooting</h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Check device power</li>
              <li>Verify WiFi connection</li>
              <li>Ensure device is within WiFi range</li>
              <li>Try device restart</li>
              <li>Check for firmware updates</li>
            </ol>

            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mt-4">
              <p className="text-yellow-800 font-medium">Important:</p>
              <p className="text-yellow-700">If your device remains offline for an extended period, check the ESP32 Guide for detailed troubleshooting steps.</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="history-stats">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              <span>History & Statistics</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Viewing History</h3>
            <p>Access detailed feeding history:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Daily feeding log</li>
              <li>Weekly/monthly summaries</li>
              <li>Success/failure records</li>
              <li>Manual vs. scheduled feeds</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Statistics</h3>
            <p>Analyze feeding patterns:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Total food dispensed</li>
              <li>Average portions</li>
              <li>Peak feeding times</li>
              <li>Device reliability stats</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Exporting Data</h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Select date range</li>
              <li>Choose export format (CSV/PDF)</li>
              <li>Download report</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="settings">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              <span>Settings & Preferences</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Account Settings</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Profile Information:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Update name</li>
                  <li>Change email</li>
                  <li>Modify username</li>
                  <li>Reset password</li>
                </ul>
              </li>
              <li><strong>Preferences:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Time zone</li>
                  <li>Date format</li>
                  <li>Language</li>
                  <li>Theme (Light/Dark)</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Device Settings</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Device name</li>
              <li>Portion sizes</li>
              <li>LED brightness</li>
              <li>Sound settings</li>
              <li>Maintenance schedule</li>
            </ul>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
              <p className="text-blue-800 font-medium">Tip:</p>
              <p className="text-blue-700">Regularly review and update your settings to ensure optimal device performance and user experience.</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security-privacy">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              <span>Security & Privacy</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Account Security</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Password Requirements:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Minimum 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </li>
              <li><strong>Two-Factor Authentication:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Email verification</li>
                  <li>Authenticator app support</li>
                  <li>SMS verification (optional)</li>
                </ul>
              </li>
              <li><strong>Session Management:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>View active sessions</li>
                  <li>Remote logout capability</li>
                  <li>Automatic session timeout</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Data Privacy</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Data Collection:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Feeding schedules and history</li>
                  <li>Device usage statistics</li>
                  <li>User preferences</li>
                  <li>Connection logs</li>
                </ul>
              </li>
              <li><strong>Data Storage:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Encrypted cloud storage</li>
                  <li>Regular backups</li>
                  <li>30-day retention policy</li>
                </ul>
              </li>
              <li><strong>Data Access:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>View collected data</li>
                  <li>Download personal data</li>
                  <li>Request data deletion</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Device Access Control</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access Levels:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Owner (full control)</li>
                  <li>Family member (limited control)</li>
                  <li>Guest (view only)</li>
                </ul>
              </li>
              <li><strong>Permission Management:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Add/remove users</li>
                  <li>Modify access rights</li>
                  <li>Set time-based access</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Security Best Practices</h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Enable two-factor authentication</li>
              <li>Use a unique, strong password</li>
              <li>Regularly review active sessions</li>
              <li>Monitor device access logs</li>
              <li>Keep software up to date</li>
              <li>Review and revoke unused access</li>
            </ol>

            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mt-4">
              <p className="text-yellow-800 font-medium">Important:</p>
              <p className="text-yellow-700">Never share your login credentials or device access tokens with anyone. The PetFeeder Hub team will never ask for your password.</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sharing-collaboration">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <Share className="mr-2 h-5 w-5" />
              <span>Sharing & Collaboration</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Device Sharing</h3>
            <p>Share your PetFeeder with family members or pet sitters:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Navigate to Device Settings</li>
              <li>Select "Manage Access"</li>
              <li>Click "Add User"</li>
              <li>Choose sharing options:
                <ul className="list-disc list-inside ml-6 mt-2">
                  <li>Email invitation</li>
                  <li>Access level selection</li>
                  <li>Time-based access</li>
                  <li>Custom permissions</li>
                </ul>
              </li>
            </ol>

            <h3 className="text-lg font-semibold mt-4">Access Levels</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Owner:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Full device control</li>
                  <li>Manage other users</li>
                  <li>Change device settings</li>
                  <li>View all history</li>
                </ul>
              </li>
              <li><strong>Family Member:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Manual feeding control</li>
                  <li>Schedule management</li>
                  <li>View history</li>
                  <li>Basic settings</li>
                </ul>
              </li>
              <li><strong>Guest:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>View device status</li>
                  <li>View schedules</li>
                  <li>Limited history access</li>
                  <li>No control functions</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Managing Shared Access</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Modify Access:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Change access level</li>
                  <li>Update permissions</li>
                  <li>Set access duration</li>
                </ul>
              </li>
              <li><strong>Revoke Access:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Immediate removal</li>
                  <li>Scheduled removal</li>
                  <li>Temporary suspension</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Activity Monitoring</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>View user activity logs</li>
              <li>Track manual feedings</li>
              <li>Monitor schedule changes</li>
              <li>Review access attempts</li>
            </ul>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
              <p className="text-blue-800 font-medium">Tip:</p>
              <p className="text-blue-700">Regularly review shared access and remove any users who no longer need access to your device.</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="monitoring">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              <span>Food Level Monitoring</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Understanding the Indicators</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>LED Status:
                <ul className="list-none ml-6">
                  <li>- Solid: Normal operation</li>
                  <li>- Fast blink: Low food level</li>
                  <li>- Slow blink: No WiFi connection</li>
                </ul>
              </li>
              <li>Dashboard shows current food level percentage</li>
              <li>Low food alerts at 20% capacity</li>
            </ul>

            <div className="bg-blue-50 p-4 rounded-md mt-4">
              <p className="text-sm text-blue-800">
                Tip: Regular monitoring helps ensure your pet never runs out of food.
                Set up notifications to receive alerts when food level is low.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="offline">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              <span>Offline Operation</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <p>The PetFeeder continues to work even without internet connection:</p>
            
            <ul className="list-disc list-inside space-y-2">
              <li>Scheduled feedings continue to work</li>
              <li>Manual button remains functional</li>
              <li>LED indicates offline status</li>
              <li>Creates local access point if needed</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Accessing Offline Mode</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Connect to "PetFeeder-Setup" WiFi</li>
              <li>Open web browser to access control panel</li>
              <li>Use basic controls and monitoring</li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="maintenance">
          <AccordionTrigger className="text-lg font-medium">
            <div className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              <span>Maintenance</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <h3 className="text-lg font-semibold">Regular Maintenance</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Clean the food container weekly</li>
              <li>Check for food blockages</li>
              <li>Verify sensor operation</li>
              <li>Test manual feed button</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Cleaning Instructions</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Unplug the device</li>
              <li>Remove food container</li>
              <li>Clean with dry cloth</li>
              <li>Avoid water near electronics</li>
            </ol>

            <div className="bg-red-50 p-4 rounded-md mt-4">
              <p className="text-sm text-red-800">
                Warning: Never use water to clean electronic components.
                Always unplug the device before cleaning.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}; 