# Auto Cat Feeder

A web application for controlling and monitoring your pet feeder remotely. Built with React, TypeScript, and Firebase.

## Features

- User authentication and authorization
- Feeding schedule management
- Manual feeding control
- Feeding history and statistics
- Device connectivity management
- Push notifications for feeding events
- Responsive design for mobile and desktop
- User profile management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Firebase Storage CORS Configuration

If you're experiencing CORS issues with Firebase Storage (especially when uploading or retrieving profile pictures), you need to configure CORS for your Firebase Storage bucket.

See the [Firebase CORS Setup Guide](./FIREBASE_CORS_SETUP.md) for detailed instructions.

## Building for Production

```
npm run build
```

## Deployment Options

You can deploy this application using various hosting services. This project is specifically configured for GitHub Pages and Netlify.

### GitHub Pages Deployment

1. **Update the homepage in package.json**:
   
   Edit the `homepage` field in `package.json` to match your GitHub username and repository name:
   ```json
   "homepage": "https://yourusername.github.io/petfeeder-hub"
   ```

2. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

   This will build your application and push it to the `gh-pages` branch of your repository.

3. **Configure GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Select the `gh-pages` branch as the source
   - Click Save

4. **Access your deployed application**:
   Your application will be available at `https://yourusername.github.io/petfeeder-hub`

### Netlify Deployment

1. **Create a Netlify account** if you don't have one: [Netlify Sign Up](https://app.netlify.com/signup)

2. **Deploy via Netlify CLI**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Initialize Netlify in your project
   netlify init
   
   # Deploy to Netlify
   netlify deploy --prod
   ```

3. **Deploy via Netlify UI**:
   - Go to [Netlify](https://app.netlify.com/)
   - Click "New site from Git"
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

4. **Access your deployed application**:
   Netlify will provide you with a URL like `https://your-site-name.netlify.app`

## Firebase Database Paths for Arduino ESP32 Integration

The application uses Firebase Realtime Database for storing and retrieving data. Here are the key database paths that your Arduino ESP32 device should interact with:

### Device Status

```
/users/{userId}/deviceStatus
```

The device should update this path with its current status:

```json
{
  "online": true,
  "lastSeen": timestamp,
  "foodLevel": 75, // percentage
  "batteryLevel": 90, // percentage
  "firmwareVersion": "1.0.0"
}
```

### Feeding Schedule

```
/users/{userId}/feedingSchedule
```

The device should read this path to get the feeding schedule:

```json
{
  "schedule1": {
    "time": "08:00",
    "amount": 25,
    "enabled": true,
    "days": {
      "monday": true,
      "tuesday": true,
      "wednesday": true,
      "thursday": true,
      "friday": true,
      "saturday": true,
      "sunday": true
    }
  },
  "schedule2": {
    // Another schedule
  }
}
```

### Manual Feeding

```
/users/{userId}/manualFeed
```

The device should listen for changes on this path to trigger manual feeding:

```json
{
  "timestamp": timestamp,
  "amount": 20,
  "status": "pending" // The device should update this to "completed" or "failed"
}
```

### Feeding History

```
/users/{userId}/feedingHistory
```

The device should write to this path after each feeding event:

```json
{
  "feeding1": {
    "timestamp": timestamp,
    "amount": 25,
    "type": "scheduled", // or "manual"
    "success": true
  }
}
```

### WiFi Credentials

```
/users/{userId}/wifiCredentials
```

The device can read this path to get WiFi credentials for connecting to a new network:

```json
{
  "ssid": "NetworkName",
  "password": "NetworkPassword",
  "timestamp": timestamp
}
```

## Security Considerations

- The ESP32 device should use Firebase Authentication to securely access the database
- Use Firebase Security Rules to restrict access to user data
- Store sensitive information like WiFi passwords securely

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Developer: [@GamerNo002117](https://redwancodes.com)
Email: GamerNo002117@redwancodes.com
