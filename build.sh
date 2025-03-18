# Run cleanup script if it exists
if [ -f "cleanup.sh" ]; then
  echo "Running cleanup script..."
  bash cleanup.sh
fi

# Install dependencies
npm install
npm install --save-dev tailwindcss postcss autoprefixer
npm install --save uuid
npm install --save-dev terser

# Create directories if they don't exist
mkdir -p src/styles
mkdir -p src/pages
mkdir -p src/components

# Handle configuration files if they don't exist
if [ ! -f "postcss.config.js" ]; then
  echo "Creating PostCSS configuration file..."
  echo 'export default {
  plugins: {
    "tailwindcss": {},
    "autoprefixer": {},
  },
};' > postcss.config.js
fi

if [ ! -f "tailwind.config.js" ]; then
  echo "Creating Tailwind configuration file..."
  echo '/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};' > tailwind.config.js
fi

# Create CSS files if they don't exist
if [ ! -f "src/styles/globals.css" ]; then
  echo "Creating globals.css..."
  echo '@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}' > src/styles/globals.css
fi

if [ ! -f "src/index.css" ]; then
  echo "Creating index.css..."
  echo '@import "./styles/globals.css";

/* Add your custom styles below */' > src/index.css
fi

# Create page placeholder files if they don't exist
if [ ! -d "src/pages" ]; then
  echo "Creating page placeholders..."
  mkdir -p src/pages
  
  echo "import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white'>
            Sign in to your account
          </h2>
        </div>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label htmlFor='email-address' className='sr-only'>
                Email address
              </label>
              <input
                id='email-address'
                type='email'
                autoComplete='email'
                {...register('email', { required: true })}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm'
                placeholder='Email address'
              />
              {errors.email && <p className='text-red-500 text-xs mt-1'>Email is required</p>}
            </div>
            <div>
              <label htmlFor='password' className='sr-only'>
                Password
              </label>
              <input
                id='password'
                type='password'
                autoComplete='current-password'
                {...register('password', { required: true })}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm'
                placeholder='Password'
              />
              {errors.password && <p className='text-red-500 text-xs mt-1'>Password is required</p>}
            </div>
          </div>
          <div>
            <button
              type='submit'
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;" > src/pages/LoginPage.tsx
  
  echo "import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await registerUser(data.email, data.password, data.name);
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white'>
            Create a new account
          </h2>
        </div>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label htmlFor='name' className='sr-only'>
                Full Name
              </label>
              <input
                id='name'
                type='text'
                {...register('name', { required: true })}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm'
                placeholder='Full Name'
              />
              {errors.name && <p className='text-red-500 text-xs mt-1'>Name is required</p>}
            </div>
            <div>
              <label htmlFor='email-address' className='sr-only'>
                Email address
              </label>
              <input
                id='email-address'
                type='email'
                autoComplete='email'
                {...register('email', { required: true })}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm'
                placeholder='Email address'
              />
              {errors.email && <p className='text-red-500 text-xs mt-1'>Email is required</p>}
            </div>
            <div>
              <label htmlFor='password' className='sr-only'>
                Password
              </label>
              <input
                id='password'
                type='password'
                autoComplete='new-password'
                {...register('password', { required: true, minLength: 6 })}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm'
                placeholder='Password'
              />
              {errors.password && <p className='text-red-500 text-xs mt-1'>Password is required (min 6 characters)</p>}
            </div>
          </div>
          <div>
            <button
              type='submit'
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;" > src/pages/RegisterPage.tsx
  
  echo "import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Welcome to Pet Feeder</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Recent Feedings</h2>
          <p>No recent feedings recorded.</p>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Food Level</h2>
          <div className='h-4 w-full bg-gray-200 rounded-full'>
            <div className='h-4 bg-primary rounded-full' style={{ width: '75%' }}></div>
          </div>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>75% remaining</p>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Device Status</h2>
          <p className='text-green-500'>Online</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;" > src/pages/HomePage.tsx
  
  echo "import React from 'react';

const FeedingSchedulePage: React.FC = () => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Feeding Schedule</h1>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>Current Schedule</h2>
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead>
              <tr>
                <th className='px-4 py-2 text-left'>Time</th>
                <th className='px-4 py-2 text-left'>Amount</th>
                <th className='px-4 py-2 text-left'>Days</th>
                <th className='px-4 py-2 text-left'>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='border px-4 py-2'>8:00 AM</td>
                <td className='border px-4 py-2'>1/2 cup</td>
                <td className='border px-4 py-2'>Mon, Tue, Wed, Thu, Fri</td>
                <td className='border px-4 py-2'>
                  <button className='text-blue-500 mr-2'>Edit</button>
                  <button className='text-red-500'>Delete</button>
                </td>
              </tr>
              <tr>
                <td className='border px-4 py-2'>6:00 PM</td>
                <td className='border px-4 py-2'>1/2 cup</td>
                <td className='border px-4 py-2'>Mon, Tue, Wed, Thu, Fri</td>
                <td className='border px-4 py-2'>
                  <button className='text-blue-500 mr-2'>Edit</button>
                  <button className='text-red-500'>Delete</button>
                </td>
              </tr>
              <tr>
                <td className='border px-4 py-2'>9:00 AM</td>
                <td className='border px-4 py-2'>3/4 cup</td>
                <td className='border px-4 py-2'>Sat, Sun</td>
                <td className='border px-4 py-2'>
                  <button className='text-blue-500 mr-2'>Edit</button>
                  <button className='text-red-500'>Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button className='mt-6 bg-primary text-white py-2 px-4 rounded'>Add New Schedule</button>
      </div>
    </div>
  );
};

export default FeedingSchedulePage;" > src/pages/FeedingSchedulePage.tsx
  
  echo "import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Settings</h1>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
        <h2 className='text-xl font-semibold mb-4'>Device Settings</h2>
        <form>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Device Name</label>
            <input
              type='text'
              className='w-full p-2 border rounded'
              defaultValue='Kitchen Pet Feeder'
            />
          </div>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Time Zone</label>
            <select className='w-full p-2 border rounded'>
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
              <option>Pacific Time (PT)</option>
            </select>
          </div>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Portion Size</label>
            <select className='w-full p-2 border rounded'>
              <option>Small (1/4 cup)</option>
              <option>Medium (1/2 cup)</option>
              <option>Large (3/4 cup)</option>
              <option>Extra Large (1 cup)</option>
            </select>
          </div>
          <div className='mb-4 flex items-center'>
            <input type='checkbox' id='notifications' className='mr-2' />
            <label htmlFor='notifications'>Enable Notifications</label>
          </div>
          <button type='submit' className='bg-primary text-white py-2 px-4 rounded'>
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;" > src/pages/SettingsPage.tsx
  
  echo "import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Your Profile</h1>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
        <div className='mb-6 flex items-center'>
          <div className='h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl text-gray-600'>
            {user?.name?.[0] || user?.email?.[0]}
          </div>
          <div className='ml-4'>
            <h2 className='text-xl font-bold'>{user?.name || 'User'}</h2>
            <p className='text-gray-600 dark:text-gray-300'>{user?.email}</p>
          </div>
        </div>
        
        <div className='mb-6'>
          <h3 className='text-lg font-semibold mb-3'>Account Information</h3>
          <div className='mb-2'>
            <span className='text-gray-500 dark:text-gray-400'>Email:</span> {user?.email}
          </div>
          <div className='mb-2'>
            <span className='text-gray-500 dark:text-gray-400'>Member since:</span> March 2024
          </div>
        </div>
        
        <div className='mb-6'>
          <h3 className='text-lg font-semibold mb-3'>Connected Devices</h3>
          <div className='mb-2'>
            <span className='text-gray-500 dark:text-gray-400'>Device 1:</span> Kitchen Pet Feeder
            <span className='ml-3 text-green-500 text-sm'>Online</span>
          </div>
        </div>
        
        <div className='flex mt-8'>
          <button className='bg-blue-500 text-white py-2 px-4 rounded mr-3'>
            Edit Profile
          </button>
          <button 
            className='bg-red-500 text-white py-2 px-4 rounded'
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;" > src/pages/ProfilePage.tsx
fi

# Create Layout component if it doesn't exist
if [ ! -f "src/components/Layout.tsx" ]; then
  mkdir -p src/components
  echo "import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className='flex h-screen bg-gray-100 dark:bg-gray-900'>
      {/* Sidebar */}
      <div className='w-64 bg-white dark:bg-gray-800 shadow-lg'>
        <div className='p-4'>
          <h1 className='text-2xl font-bold text-primary'>Pet Feeder</h1>
        </div>
        <nav className='mt-6'>
          <Link
            to='/'
            className={\`flex items-center px-4 py-2 \${
              location.pathname === '/' 
                ? 'bg-primary bg-opacity-10 text-primary' 
                : 'text-gray-700 dark:text-gray-200'
            }\`}
          >
            <span>Dashboard</span>
          </Link>
          <Link
            to='/feeding-schedule'
            className={\`flex items-center px-4 py-2 \${
              location.pathname === '/feeding-schedule' 
                ? 'bg-primary bg-opacity-10 text-primary' 
                : 'text-gray-700 dark:text-gray-200'
            }\`}
          >
            <span>Feeding Schedule</span>
          </Link>
          <Link
            to='/settings'
            className={\`flex items-center px-4 py-2 \${
              location.pathname === '/settings' 
                ? 'bg-primary bg-opacity-10 text-primary' 
                : 'text-gray-700 dark:text-gray-200'
            }\`}
          >
            <span>Settings</span>
          </Link>
          <Link
            to='/profile'
            className={\`flex items-center px-4 py-2 \${
              location.pathname === '/profile' 
                ? 'bg-primary bg-opacity-10 text-primary' 
                : 'text-gray-700 dark:text-gray-200'
            }\`}
          >
            <span>Profile</span>
          </Link>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className='flex-1 overflow-y-auto'>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;" > src/components/Layout.tsx
fi

# Run build script
npm run build

# Check for conflicts before pushing
if git status | grep -q "both modified"; then
  echo "Merge conflicts detected. Please run './resolve-conflicts.sh' to fix them."
  exit 1
fi

# Add all changes
git add .

# Commit changes
git commit -m "Build and update project files"

# Pull with rebase to avoid additional merge commits
git pull --rebase origin main

# Push changes
git push origin main
