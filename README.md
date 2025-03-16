# PetFeeder Hub

A modern web application for managing smart pet feeders. Control feeding schedules, monitor food levels, and manage multiple devices from anywhere.

## Features

- 🔐 Secure Authentication
- 📱 Responsive Design
- 📊 Real-time Monitoring
- ⏰ Feeding Schedules
- 📈 Analytics Dashboard
- 👥 User Management
- 🤖 Device Management
- 📝 System Logs

## Tech Stack

- React 18
- TypeScript
- Vite
- Supabase
- TailwindCSS
- React Router
- React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/petfeeder-hub.git
cd petfeeder-hub
```

2. Install dependencies:
```bash
npm install
```

3. Create environment files:
   - Copy `.env.example` to `.env.development` and `.env.production`
   - Fill in your Supabase credentials

4. Start development server:
```bash
npm run dev
```

### Building for Production

1. Build the application:
```bash
npm run build
```

2. Preview the build:
```bash
npm run preview
```

### Deployment

The application can be deployed to GitHub Pages:

1. Install the gh-pages package (if not already installed):
```bash
npm install --save-dev gh-pages
```

2. Make sure your package.json has the correct homepage and deploy script:
```json
"homepage": "https://petfeeder.redwancodes.com",
"scripts": {
  "deploy": "gh-pages -d dist"
}
```

3. Deploy:
```bash
npm run deploy
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run validate` - Run type checking, linting, and tests
- `npm run analyze` - Analyze bundle size

### Project Structure

```
src/
├── components/     # Reusable components
│   ├── admin/     # Admin-specific components
│   ├── layout/    # Layout components
│   └── ui/        # UI components
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── lib/          # Utility functions
├── pages/        # Page components
└── types/        # TypeScript types
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@petfeeder.com or join our Slack channel.
