import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function APIGuide() {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          This guide covers the API endpoints and integration methods for the PetFeeder system.
        </AlertDescription>
      </Alert>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="authentication">
          <AccordionTrigger>Authentication</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Firebase Authentication</h3>
              <p>The PetFeeder API uses Firebase Authentication. Include your Firebase auth token in the Authorization header:</p>
              <pre className="bg-gray-100 p-4 rounded-md">
                <code>
                  Authorization: Bearer {'{your-firebase-token}'}
                </code>
              </pre>

              <div className="bg-yellow-50 p-4 rounded-md mt-4">
                <p className="text-sm text-yellow-800">
                  Important: Keep your Firebase credentials secure and never expose them in client-side code.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="devices">
          <AccordionTrigger>Device Endpoints</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Device Management</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium">GET /api/devices</h4>
                  <p className="text-sm text-gray-600 mt-1">List all devices associated with the user</p>
                  <pre className="bg-gray-100 p-4 rounded-md mt-2">
                    <code>
                      {`// Response
{
  "devices": [
    {
      "id": "device_id",
      "name": "Kitchen Feeder",
      "status": "online",
      "lastFeed": "2024-03-21T10:30:00Z",
      "foodLevel": 75
    }
  ]
}`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium">GET /api/devices/{'{device_id}'}</h4>
                  <p className="text-sm text-gray-600 mt-1">Get detailed information about a specific device</p>
                  <pre className="bg-gray-100 p-4 rounded-md mt-2">
                    <code>
                      {`// Response
{
  "id": "device_id",
  "name": "Kitchen Feeder",
  "status": "online",
  "lastFeed": "2024-03-21T10:30:00Z",
  "foodLevel": 75,
  "schedule": [
    {
      "id": "schedule_1",
      "time": "08:00",
      "amount": "medium",
      "enabled": true
    }
  ]
}`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium">POST /api/devices/{'{device_id}'}/feed</h4>
                  <p className="text-sm text-gray-600 mt-1">Trigger an immediate feeding</p>
                  <pre className="bg-gray-100 p-4 rounded-md mt-2">
                    <code>
                      {`// Request
{
  "amount": "medium"  // small, medium, large
}

// Response
{
  "success": true,
  "feedTime": "2024-03-21T10:30:00Z"
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="schedules">
          <AccordionTrigger>Schedule Endpoints</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Feeding Schedule Management</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium">GET /api/devices/{'{device_id}'}/schedules</h4>
                  <p className="text-sm text-gray-600 mt-1">List all feeding schedules for a device</p>
                  <pre className="bg-gray-100 p-4 rounded-md mt-2">
                    <code>
                      {`// Response
{
  "schedules": [
    {
      "id": "schedule_1",
      "time": "08:00",
      "amount": "medium",
      "enabled": true,
      "days": ["mon", "tue", "wed", "thu", "fri"]
    }
  ]
}`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium">POST /api/devices/{'{device_id}'}/schedules</h4>
                  <p className="text-sm text-gray-600 mt-1">Create a new feeding schedule</p>
                  <pre className="bg-gray-100 p-4 rounded-md mt-2">
                    <code>
                      {`// Request
{
  "time": "08:00",
  "amount": "medium",
  "days": ["mon", "tue", "wed", "thu", "fri"]
}

// Response
{
  "id": "schedule_1",
  "time": "08:00",
  "amount": "medium",
  "enabled": true,
  "days": ["mon", "tue", "wed", "thu", "fri"]
}`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium">PUT /api/devices/{'{device_id}'}/schedules/{'{schedule_id}'}</h4>
                  <p className="text-sm text-gray-600 mt-1">Update an existing schedule</p>
                  <pre className="bg-gray-100 p-4 rounded-md mt-2">
                    <code>
                      {`// Request
{
  "time": "09:00",
  "enabled": false
}

// Response
{
  "id": "schedule_1",
  "time": "09:00",
  "amount": "medium",
  "enabled": false,
  "days": ["mon", "tue", "wed", "thu", "fri"]
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="monitoring">
          <AccordionTrigger>Monitoring Endpoints</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Device Monitoring</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium">GET /api/devices/{'{device_id}'}/status</h4>
                  <p className="text-sm text-gray-600 mt-1">Get real-time device status</p>
                  <pre className="bg-gray-100 p-4 rounded-md mt-2">
                    <code>
                      {`// Response
{
  "status": "online",
  "foodLevel": 75,
  "lastFeed": "2024-03-21T10:30:00Z",
  "nextScheduledFeed": "2024-03-21T17:00:00Z",
  "batteryLevel": 90,
  "wifiStrength": 85
}`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium">GET /api/devices/{'{device_id}'}/history</h4>
                  <p className="text-sm text-gray-600 mt-1">Get feeding history</p>
                  <pre className="bg-gray-100 p-4 rounded-md mt-2">
                    <code>
                      {`// Response
{
  "history": [
    {
      "time": "2024-03-21T10:30:00Z",
      "amount": "medium",
      "type": "scheduled",
      "success": true
    }
  ]
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="websocket">
          <AccordionTrigger>WebSocket API</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Real-time Updates</h3>
              <p>Connect to our WebSocket endpoint for real-time device updates:</p>
              <pre className="bg-gray-100 p-4 rounded-md">
                <code>
                  {`ws://api.petfeeder.com/ws?token={firebase-token}

// Event Types:
{
  "type": "device_status",
  "data": {
    "deviceId": "device_id",
    "status": "online",
    "foodLevel": 75
  }
}

{
  "type": "feeding_complete",
  "data": {
    "deviceId": "device_id",
    "time": "2024-03-21T10:30:00Z",
    "amount": "medium"
  }
}`}
                </code>
              </pre>

              <div className="bg-blue-50 p-4 rounded-md mt-4">
                <p className="text-sm text-blue-800">
                  Tip: Use WebSocket connections for the most responsive device monitoring and control.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="errors">
          <AccordionTrigger>Error Handling</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Error Responses</h3>
              <p>All API errors follow this format:</p>
              <pre className="bg-gray-100 p-4 rounded-md">
                <code>
                  {`{
  "error": {
    "code": "error_code",
    "message": "Human readable error message",
    "details": {
      // Additional error context
    }
  }
}

Common Error Codes:
- auth_error: Authentication failed
- device_offline: Device is not connected
- invalid_request: Invalid request parameters
- schedule_conflict: Schedule overlaps with existing one
- device_error: Hardware-related error`}
                </code>
              </pre>

              <div className="bg-yellow-50 p-4 rounded-md mt-4">
                <p className="text-sm text-yellow-800">
                  Always implement proper error handling in your applications to ensure a smooth user experience.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 