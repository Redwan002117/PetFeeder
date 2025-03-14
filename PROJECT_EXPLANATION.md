# PetFeeder Hub - Project Overview

## Project Description
PetFeeder Hub is a smart pet feeding system that combines hardware (Arduino-based feeder) with a web application for remote control and monitoring. The system allows users to schedule feeding times, monitor food levels, and manually trigger feeding events.

## Architecture

### Components
1. **Hardware Device (Arduino)**
   - Pet feeder hardware with sensors and actuators
   - WiFi connectivity for cloud communication
   - Local web server for direct control
   - EEPROM storage for feeding schedules

2. **Web Application**
   - React-based frontend
   - Real-time device monitoring and control
   - User authentication and device management

3. **Backend/Cloud Services**
   - Firebase Realtime Database for device-to-cloud communication
   - User authentication and device association
   - Real-time updates and feeding requests

## Data Storage

### Firebase Realtime Database Structure
```
/devices/{userId}/
  ├── name: string
  ├── status: string
  ├── foodLevel: number
  ├── lastSeen: number
  └── wifiConfig/
      ├── ssid: string
      ├── password: string
      ├── hotspotEnabled: boolean
      ├── hotspotName: string
      └── hotspotPassword: string

/feeding_requests/{userId}/
  ├── amount: number
  ├── timestamp: number
  └── status: string
```

## Real-time Features
1. **Device Status Monitoring**
   - Online/offline status
   - Food level monitoring
   - Last seen timestamp

2. **Feeding Control**
   - Manual feeding triggers
   - Scheduled feeding events
   - Feeding confirmation and logging

3. **Device Configuration**
   - WiFi settings management
   - Device name customization
   - Hotspot configuration

## Setup Instructions

### Prerequisites
1. Arduino IDE and required libraries
2. Node.js and npm
3. Firebase account
4. Hardware components as per the Arduino sketch

### Firebase Setup
1. Create a new Firebase project
2. Enable Realtime Database
3. Set up Authentication (email/password)
4. Configure Firebase security rules
5. Copy Firebase configuration:
   - Go to Project Settings
   - Find the Firebase SDK configuration
   - Create `.env` file with the following variables:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Application Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see above)
4. Start development server: `npm run dev`

### Arduino Setup
1. Open `arduino-example/petfeeder/petfeeder.ino`
2. Install required libraries
3. Configure WiFi credentials
4. Upload to your Arduino device
5. Connect the hardware components according to the schematic

## Usage

### Web Application
1. Create an account or sign in
2. Configure your device settings
3. Set up feeding schedules
4. Monitor device status
5. Trigger manual feeding when needed

### Hardware Device
1. Power on the device
2. Connect to WiFi using configured credentials
3. Device will automatically register with the cloud
4. LED indicators show device status
5. Manual feed button available for local control

## Troubleshooting

### Common Issues
1. Device Offline
   - Check WiFi connection
   - Verify Firebase credentials
   - Ensure device is powered

2. Feeding Failures
   - Check food level
   - Verify motor operation
   - Check for mechanical blockages

3. Connection Issues
   - Verify WiFi credentials
   - Check Firebase rules
   - Ensure database URL is correct

For additional support, check the Arduino serial monitor for detailed debugging information.