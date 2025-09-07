# Resume Variants Migration Execution Guide

## Status Summary

**Migration Required**: ✅ YES  
**Migration File**: `supabase/migrations/20250106_create_resume_variants.sql`  
**Tables to Create**: `resume_variants`, `resume_suggestions`

### Current Database State
- ✅ `resume_data` table exists
- ✅ `jobs` table exists  
- ✅ `user_profiles` table exists
- ❌ `resume_variants` table missing
- ❌ `resume_suggestions` table missing

## Why Automated Execution Failed

The automated execution through the API endpoints failed because:
1. **Permission Limitation**: The anonymous Supabase key doesn't have DDL permissions
2. **Missing Function**: The `exec_sql` function doesn't exist in the database
3. **Security Restriction**: Supabase restricts direct SQL execution for security

## Manual Execution Instructions

### Option 1: Supabase Dashboard (Recommended)

1. **Access Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Sign in to your account
   - Navigate to your project: `ieliwaibbkexqbudfher`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the Migration**
   - Copy the contents of `/supabase/migrations/20250106_create_resume_variants.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

### Option 2: Command Line (If you have credentials)

If you have the Supabase access token and project reference:

```bash
# Set environment variables
export SUPABASE_ACCESS_TOKEN=your_access_token_here
export SUPABASE_PROJECT_REF=ieliwaibbkexqbudfher

# Execute the migration
node tools/supabase-admin.js apply-file supabase/migrations/20250106_create_resume_variants.sql
```

## Migration Contents Summary

The migration creates:

### 1. `resume_variants` Table
- Stores job-specific tailored resumes
- Links to base resume, job, and user
- Includes tailoring metadata (match score, keywords, etc.)

### 2. `resume_suggestions` Table  
- Stores atomic GPT suggestions for resume improvements
- Links to resume variants
- Includes suggestion type, confidence, impact level

### 3. Indexes
- Performance indexes on user_id, session_id, job_id, base_resume_id
- Suggestion indexes on variant_id, job_id, accepted status

### 4. RLS Policies
- Row-level security for user data isolation
- Support for both authenticated users and session-based access

### 5. Triggers
- Automatic `updated_at` timestamp updates
- Uses existing `update_updated_at_column()` function

## Verification

After executing the migration, verify success by:

1. **Check Tables Created**
   ```bash
   curl -s http://localhost:3002/api/supabase/check-tables | jq '.summary'
   ```

2. **Expected Output**
   ```json
   {
     "all_tables_exist": true,
     "migration_needed": false,
     "required_tables": {
       "resume_variants": true,
       "resume_suggestions": true
     }
   }
   ```

## Next Steps

Once the migration is complete:
1. The resume tailoring features will be fully functional
2. The application can store job-specific resume variants
3. GPT suggestions can be stored and managed atomically

## Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Verify all foreign key constraints are satisfied
3. Ensure the base tables (`resume_data`, `jobs`, `user_profiles`) exist
4. Contact the development team with the specific error message