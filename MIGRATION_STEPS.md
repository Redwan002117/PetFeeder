# Supabase Migration Steps

## 1. Initial Setup

1. Create Supabase project:
   ```bash
   # Run setup script
   chmod +x scripts/setup-supabase.sh
   ./scripts/setup-supabase.sh
   ```

2. Configure environment:
   - Update `.env` with Supabase credentials
   - Remove Firebase config

## 2. Database Migration

1. Run database initialization:
   ```bash
   supabase db reset
   ```

2. Migrate existing data:
   ```bash
   node scripts/migrate-data.js
   ```

## 3. Application Updates

1. Remove Firebase files:
   - Delete src/lib/firebase-*.ts files
   - Remove Firebase configuration files

2. Update deployment configuration:
   - Remove firebase.json
   - Update deployment scripts in package.json

## 4. Testing

1. Test authentication flows:
   - Sign up
   - Sign in
   - Password reset
   - Google authentication

2. Test data operations:
   - Device management
   - Feeding schedules
   - History tracking

## 5. Deployment

1. Deploy database changes:
   ```bash
   npm run deploy:db
   ```

2. Deploy application:
   ```bash
   npm run deploy:hosting
   ```

## Verification Checklist

- [ ] All users can sign in
- [ ] User roles and permissions work correctly
- [ ] Device management functions properly
- [ ] Feeding schedules execute as expected
- [ ] Real-time updates work
- [ ] Data migration completed successfully
- [ ] All environment variables are set
- [ ] Application deployed successfully