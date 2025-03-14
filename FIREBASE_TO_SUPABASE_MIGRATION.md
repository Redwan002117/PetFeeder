# Firebase to Supabase Migration Guide

This guide will help you migrate your Firebase application to Supabase, with a special focus on authentication and database changes.

## 1. Update Dependencies

First, we need to remove Firebase dependencies and add Supabase ones:

```bash
# Remove Firebase dependencies
npm uninstall firebase @firebase/app @firebase/auth @firebase/firestore

# Install Supabase dependencies
npm install @supabase/supabase-js
```

## 2. Environment Variables

Replace your Firebase environment variables with Supabase ones:

```bash
# Old Firebase variables in .env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
# etc...

# New Supabase variables in .env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Initialize Supabase Client

Create a new file `src/lib/supabase-client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 4. Update Authentication Components

### Login Page (src/pages/Login.tsx)
```typescript
import { useState } from 'react'
import { supabase } from '../lib/supabase-client'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // Redirect or update state on success
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    // Your existing JSX with updated onSubmit handler
  )
}
```

### SignUp Page (src/pages/SignUp.tsx)
```typescript
import { useState } from 'react'
import { supabase } from '../lib/supabase-client'

export function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      // Handle successful signup
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    // Your existing JSX with updated onSubmit handler
  )
}
```

### ForgotPassword Page (src/pages/ForgotPassword.tsx)
```typescript
import { useState } from 'react'
import { supabase } from '../lib/supabase-client'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      setMessage('Check your email for the password reset link')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    // Your existing JSX with updated onSubmit handler
  )
}
```

## 5. Update Database Operations

### User Profile Operations
```typescript
// Get user profile
const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Update user profile
const updateUserProfile = async (userId: string, updates: any) => {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
  
  if (error) throw error
}
```

### Device Operations
```typescript
// Get user's devices
const getUserDevices = async (userId: string) => {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('owner_id', userId)
  
  if (error) throw error
  return data
}

// Add new device
const addDevice = async (userId: string, deviceData: any) => {
  const { error } = await supabase
    .from('devices')
    .insert([{ ...deviceData, owner_id: userId }])
  
  if (error) throw error
}
```

### Feeding Schedule Operations
```typescript
// Get user's schedules
const getSchedules = async (userId: string) => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  return data
}

// Add new schedule
const addSchedule = async (scheduleData: any) => {
  const { error } = await supabase
    .from('schedules')
    .insert([scheduleData])
  
  if (error) throw error
}
```

## 6. Update Authentication Context

Create a new auth context (src/contexts/SupabaseAuthContext.tsx):

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase-client'

const SupabaseAuthContext = createContext({
  user: null,
  loading: true,
  signUp: async (email: string, password: string) => {},
  signIn: async (email: string, password: string) => {},
  signOut: async () => {},
})

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = (email: string, password: string) => {
    return supabase.auth.signUp({ email, password })
  }

  const signIn = (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = () => {
    return supabase.auth.signOut()
  }

  return (
    <SupabaseAuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(SupabaseAuthContext)
}
```

## 7. Update Your Main App Component

```typescript
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext'

function App() {
  return (
    <SupabaseAuthProvider>
      {/* Your existing app components */}
    </SupabaseAuthProvider>
  )
}
```

## Common Migration Challenges

1. **Authentication State**: Supabase uses different auth events and methods compared to Firebase. Make sure to update all auth-related code.

2. **Database Queries**: Supabase uses a SQL-like query builder instead of Firebase's NoSQL queries. You'll need to rewrite your queries.

3. **Real-time Updates**: Replace Firebase's `onSnapshot` with Supabase's `subscribe()`:
```typescript
const subscription = supabase
  .from('your_table')
  .on('*', (payload) => {
    // Handle real-time updates
  })
  .subscribe()
```

4. **Security Rules**: Replace Firebase security rules with Supabase Row Level Security (RLS) policies.

## Testing the Migration

1. Test all authentication flows:
   - Sign up
   - Sign in
   - Password reset
   - Sign out

2. Test database operations:
   - Create/read/update/delete operations
   - Real-time subscriptions
   - File uploads (if using Storage)

3. Test security:
   - Verify RLS policies work as expected
   - Test access control
   - Verify unauthenticated users can't access protected data

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Discord Community: https://discord.supabase.com
- Migration Guides: https://supabase.com/docs/guides/migrations/firebase