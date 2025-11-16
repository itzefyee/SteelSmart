# Supabase Migration Guide

This guide walks you through migrating the StealSmart application from in-memory storage to Supabase with full authentication, database, and file storage.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Database Schema Setup](#database-schema-setup)
4. [Storage Buckets Setup](#storage-buckets-setup)
5. [Environment Configuration](#environment-configuration)
6. [Product Data Migration](#product-data-migration)
7. [Testing the Migration](#testing-the-migration)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting the migration, ensure you have:

- ✅ A Supabase account (sign up at [https://supabase.com](https://supabase.com))
- ✅ Node.js 18+ and npm installed
- ✅ All Supabase packages installed (already done via `npm install`)
- ✅ Zoo Dev API token ([https://zoo.dev](https://zoo.dev))
- ✅ Google Gemini API key ([https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey))

---

## Supabase Project Setup

### Step 1: Create a New Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `stealsmart` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Get Your Supabase Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGci...` (long string)
   - **service_role key**: `eyJhbGci...` (different long string)

⚠️ **Important**: NEVER commit the `service_role` key to git. It has admin privileges!

---

## Database Schema Setup

### Step 1: Run the Schema Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open `supabase/migrations/20250115000000_initial_schema.sql` from this project
4. Copy the **entire contents** into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. You should see: ✅ **Success. No rows returned**

### Step 2: Verify Tables Were Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see these tables:
   - `profiles`
   - `products`
   - `cad_history`
   - `drawing_analyses`
   - `rfq_submissions`
   - `file_conversions`
   - `product_favorites`

### Step 3: Verify Row Level Security (RLS) is Enabled

1. Click on any table (e.g., `cad_history`)
2. Look for **"RLS enabled"** badge at the top
3. Click **"View Policies"** to see security rules

---

## Storage Buckets Setup

### Step 1: Create Storage Buckets

1. In Supabase Dashboard, go to **Storage**
2. Click **"Create a new bucket"**
3. Create each of these buckets:

#### Bucket 1: `cad-models`
- **Name**: `cad-models`
- **Public**: ❌ No (Private)
- **File size limit**: 50 MB
- **Allowed MIME types**: `model/step, model/stl, model/obj, model/gltf+json, model/gltf-binary`

#### Bucket 2: `technical-drawings`
- **Name**: `technical-drawings`
- **Public**: ❌ No (Private)
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf, image/png, image/jpeg, image/dxf`

#### Bucket 3: `rfq-attachments`
- **Name**: `rfq-attachments`
- **Public**: ❌ No (Private)
- **File size limit**: 20 MB
- **Allowed MIME types**: `application/pdf, image/*, model/*`

#### Bucket 4: `product-images`
- **Name**: `product-images`
- **Public**: ✅ Yes (Public)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/png, image/jpeg, image/svg+xml, image/webp`

### Step 2: Set Storage RLS Policies

1. Go to **SQL Editor**
2. Open `supabase/storage_setup.sql` from this project
3. Copy the **entire contents** into the SQL Editor
4. Click **"Run"**

### Step 3: Verify Storage Policies

1. Go to **Storage** > Select any bucket (e.g., `cad-models`)
2. Click **"Policies"** tab
3. You should see policies like:
   - `Users can upload own CAD models`
   - `Users can view own CAD models`
   - `Users can delete own CAD models`

---

## Environment Configuration

### Step 1: Create .env.local File

```bash
# Copy the example file
cp .env.example .env.local
```

### Step 2: Fill in Your Credentials

Edit `.env.local` with your actual values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key...

# External APIs
ZOO_API_TOKEN=your-zoo-dev-token
GEMINI_API_KEY=your-gemini-api-key

# Application
NEXTAUTH_URL=http://localhost:3000
```

⚠️ **Never commit `.env.local` to git!** It's already in `.gitignore`.

### Step 3: Verify Environment Variables

```bash
# Check if variables are loaded
npm run dev

# You should see no errors about missing SUPABASE credentials
```

---

## Product Data Migration

### Step 1: Run the Migration Script

```bash
npm run migrate-products
# Or directly:
npx tsx scripts/migrate-products.ts
```

You should see output like:

```
🚀 Starting product migration...

🔍 Verifying Supabase connection...
✅ Connected to Supabase

📦 Found 20 products to migrate

Migrating products 1 to 10...
   ✅ Successfully migrated 10 products
Migrating products 11 to 20...
   ✅ Successfully migrated 10 products

📊 Migration Summary:
   ✅ Success: 20 products
   ❌ Failed: 0 products

✨ Product migration completed successfully!
```

### Step 2: Verify Products in Database

1. Go to **Table Editor** > **products** table
2. You should see all 20 products from `src/data/products.json`
3. Check a few products to ensure data integrity

---

## Testing the Migration

### Step 1: Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Step 2: Test Authentication

1. **Sign Up**:
   - Go to `/signup`
   - Create a new account with email/password
   - Check your email for verification link (if email is configured)
   - Check Supabase: **Authentication** > **Users** to see your user

2. **Sign In**:
   - Go to `/login`
   - Sign in with your credentials
   - You should be redirected to the home page

3. **Sign Out**:
   - Click any "Sign Out" button
   - You should be logged out

### Step 3: Test CAD Generation & Storage

1. Go to **Generate CAD** page
2. Enter a prompt: "Create a mounting bracket"
3. Generate the model
4. Check Supabase:
   - **Table Editor** > **cad_history**: Should have a new row
   - **Storage** > **cad-models**: Should have your CAD file
   - Note the `zoo_operation_id` field

### Step 4: Test Drawing Analysis & Storage

1. Go to **Analyze Drawing** page
2. Upload a technical drawing (PDF, PNG, or CAD file)
3. Analyze the drawing
4. Check Supabase:
   - **Table Editor** > **drawing_analyses**: Should have analysis result
   - **Storage** > **technical-drawings**: Should have your uploaded file

### Step 5: Test RFQ Submission

1. Go to **Request for Quote** page
2. Fill out the form with your details
3. Attach files if desired
4. Submit the RFQ
5. Check Supabase:
   - **Table Editor** > **rfq_submissions**: Should have your RFQ
   - **Storage** > **rfq-attachments**: Should have attached files (if any)

### Step 6: Test File Conversion Tracking

1. Use the file conversion feature (if available in UI)
2. Convert a CAD file (e.g., STEP → STL)
3. Check Supabase:
   - **Table Editor** > **file_conversions**: Should track the conversion

---

## Troubleshooting

### Issue: "Unauthorized" errors in API routes

**Solution:**
- Make sure you're signed in
- Check browser console for auth errors
- Verify middleware is working: Check `src/middleware.ts`

### Issue: "Row Level Security" prevents access

**Solution:**
- Go to **SQL Editor** in Supabase
- Check RLS policies are created correctly
- Verify you're authenticated with the right user

### Issue: Storage upload fails with "Access Denied"

**Solution:**
- Check storage bucket policies are set up
- Verify bucket is created with correct name
- Ensure file path follows format: `{user_id}/{filename}`

### Issue: Products table is empty

**Solution:**
- Run migration script again: `npx tsx scripts/migrate-products.ts`
- Check `src/data/products.json` exists
- Verify database connection in migration script

### Issue: "Invalid JWT" or auth errors

**Solution:**
- Clear browser cookies and localStorage
- Sign out and sign in again
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### Issue: Can't see other users' data

**Solution:**
- This is expected! RLS ensures users can only see their own data
- To see all data, use Supabase Dashboard (Table Editor)
- Admin features require service role key (backend only)

### Issue: Migration script fails with connection error

**Solution:**
- Check `.env.local` has correct credentials
- Verify Supabase project is running (not paused)
- Check internet connection
- Try running migration SQL manually in Dashboard

---

## What Changed?

### Before Migration (In-Memory)

```typescript
// Old: In-memory storage
let cadHistory: CADHistoryItem[] = [];

// Data lost on server restart
// No authentication
// No file persistence
```

### After Migration (Supabase)

```typescript
// New: Persistent database
const supabase = await getSupabaseServer();
const { data } = await supabase
  .from('cad_history')
  .select('*')
  .eq('user_id', user.id);

// ✅ Data persists across restarts
// ✅ User authentication
// ✅ Files stored in Supabase Storage
// ✅ Row Level Security
```

---

## Next Steps

After successful migration:

1. **Set up email confirmation**:
   - Go to **Authentication** > **Settings** > **Email**
   - Configure email templates

2. **Configure production URL**:
   - Update `NEXTAUTH_URL` in production `.env`

3. **Set up backups**:
   - Supabase provides automatic daily backups
   - Go to **Settings** > **Database** > **Backups**

4. **Monitor usage**:
   - Go to **Settings** > **Usage** to track database/storage limits

5. **Optimize RLS policies** (if needed):
   - Add more granular policies for specific use cases

6. **Add email notifications**:
   - Implement email sending for RFQ submissions
   - Use Supabase Edge Functions or external service

---

## Summary

✅ **Database**: All data now persists in PostgreSQL
✅ **Authentication**: User signup/login with Supabase Auth
✅ **Storage**: CAD models, drawings, and attachments in Supabase Storage
✅ **Security**: Row Level Security ensures data privacy
✅ **Scalability**: Ready for production deployment

Your StealSmart application is now fully integrated with Supabase! 🎉
