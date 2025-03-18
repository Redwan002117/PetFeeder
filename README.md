# PetFeeder Hub

PetFeeder Hub is a web application for remotely controlling and monitoring your pet feeder device. This application allows you to schedule feeding times, dispense food manually, and view feeding history.

![PetFeeder Hub Logo](src/assets/logo.png)

## Features

- 🐾 Remote control of pet feeder device 
- 📆 Scheduled feedings with custom portions
- 📊 Feeding history and statistics
- 👥 Multiple user access with permission management
- 🔔 Notifications for feeding events
- 🌙 Dark mode support

## Tech Stack

- React with TypeScript
- Supabase (Authentication, Realtime Database, Storage)
- Supabase integration
- Tailwind CSS with shadcn/ui components
- Vite for build tooling
- Deployed on GitHub Pages

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase project (for authentication and database)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/petfeeder-hub.git
   cd petfeeder-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with your Supabase configuration:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Database Management

PetFeeder uses a single database schema file located at `src/lib/DatabaseSchema.sql`. This file contains all table definitions, functions, triggers, and security policies needed by the application.

### Initializing the Database

To initialize or update the database:

```bash
npm run deploy
```

This command executes the deployment script that applies the schema to your Supabase instance.

### Working with the Database Schema

When making changes to the database:

1. Always modify `src/lib/DatabaseSchema.sql` directly
2. Keep the schema file as the single source of truth
3. Run the deployment script to apply changes

### Manual Deployment

If you need to manually deploy the schema:

1. Use the Supabase SQL Editor
2. Copy the contents of `DatabaseSchema.sql` 
3. Execute the SQL statements

## Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the main branch.

To manually deploy:

```bash
npm run deploy
# or
yarn deploy
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

For support, email support@petfeeder.com or join our Slack channel.
