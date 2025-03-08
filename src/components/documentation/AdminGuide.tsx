import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AdminGuide() {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          This guide covers administrative features and management capabilities of the PetFeeder system.
          Admin access is required for these operations.
        </AlertDescription>
      </Alert>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="admin-access">
          <AccordionTrigger>Admin Access</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Obtaining Admin Access</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Register a new account</li>
                <li>Contact system administrator</li>
                <li>Provide your account details</li>
                <li>Receive admin key</li>
                <li>Enter admin key in settings</li>
              </ol>

              <div className="bg-yellow-50 p-4 rounded-md mt-4">
                <p className="text-sm text-yellow-800">
                  Important: Keep your admin key secure. Do not share it with others.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dashboard">
          <AccordionTrigger>Admin Dashboard</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dashboard Overview</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>View all connected devices</li>
                <li>Monitor system status</li>
                <li>Access usage statistics</li>
                <li>Manage user accounts</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Available Actions</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Reset device settings</li>
                <li>Update firmware</li>
                <li>Configure global settings</li>
                <li>Export system logs</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="user-management">
          <AccordionTrigger>User Management</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">User Operations</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>View all users</li>
                <li>Reset user passwords</li>
                <li>Disable/enable accounts</li>
                <li>Assign device access</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Access Control</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Set user permissions</li>
                <li>Create user groups</li>
                <li>Manage access levels</li>
                <li>Review access logs</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="device-management">
          <AccordionTrigger>Device Management</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Device Control</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Register new devices</li>
                <li>Update device firmware</li>
                <li>Configure device settings</li>
                <li>Monitor device health</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">WiFi Configuration</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Set WiFi credentials</li>
                <li>Configure hotspot settings</li>
                <li>Manage connection fallback</li>
                <li>View connection history</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="system-logs">
          <AccordionTrigger>System Logs</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Log Access</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>View system logs</li>
                <li>Export log data</li>
                <li>Set log retention</li>
                <li>Configure log levels</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Log Categories</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Device operations</li>
                <li>User activities</li>
                <li>System events</li>
                <li>Error reports</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="best-practices">
          <AccordionTrigger>Best Practices</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Security</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Regular password updates</li>
                <li>Access key rotation</li>
                <li>Audit log review</li>
                <li>Permission verification</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Maintenance</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Regular backups</li>
                <li>System updates</li>
                <li>Performance monitoring</li>
                <li>User activity review</li>
              </ul>

              <div className="bg-blue-50 p-4 rounded-md mt-4">
                <p className="text-sm text-blue-800">
                  Tip: Regularly review system logs and user activities to maintain
                  system security and optimal performance.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 