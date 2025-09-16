# Testing Instructions for Resume Tailor Feature

## Key Fixes Implemented

1. **Timeout Issue Fixed**: Added 60-second timeout to prevent first-click failures
2. **GPT-5 Model**: Now using `gpt-5-mini` as required for job analysis
3. **Enhanced Logging**: Added comprehensive logging to debug suggestion flow
4. **Database Persistence**: Fixed suggestion saving to database

## How to Test

### Step 1: Clear Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console (Ctrl+L or right-click → Clear Console)

### Step 2: Navigate to Tailor Studio
1. Go to Jobs page
2. Select any job
3. Click "Tailor" button

### Step 3: Watch Console Output
You should see these logs in order:

```
🎯 UNIFIED ANALYSIS: Starting for job [ID], resume [ID]
🎯 UNIFIED ANALYSIS: Authenticated user: [USER_ID]
🔍 Analysis atomic_suggestions: {count: X, sections: [...], types: [...]}
📊 Valid suggestions to save: X (from Y original)
📋 Suggestion details: [...]
✅ Upserted X suggestions (idempotent)
📥 Fetching suggestions for variant: [VARIANT_ID]
📋 Found X suggestions for variant [VARIANT_ID]
📋 Loaded X suggestions from Supabase
🎯 InlineSuggestionOverlay: {totalSuggestions: X, activeSuggestions: X, ...}
```

### Step 4: Check Suggestion Display
After loading completes:

1. **Look for Accept/Decline UI**:
   - Suggestions should appear as inline chips in the tailored resume
   - Each suggestion should have Accept (✓) and Decline (✗) buttons
   - Clicking chips should show detailed before/after comparisons

2. **Accept All Button**:
   - Should show at top with gradient background
   - Shows count of available suggestions
   - Clicking applies all suggestions at once

### Step 5: Test Suggestion Interactions
1. **Individual Accept/Decline**:
   - Click on a suggestion chip
   - Review the before/after comparison
   - Click Accept (A) or Decline (X)
   - Suggestion should disappear and resume should update

2. **Keyboard Shortcuts**:
   - Press `J` to move to next suggestion
   - Press `K` to move to previous suggestion
   - Press `A` to accept current suggestion
   - Press `X` to decline current suggestion

### Step 6: Verify Data Isolation
1. **Check Base Resume**:
   - Go back to Dashboard
   - Open Resume Studio
   - Base resume should be UNCHANGED
   - Only the variant should have modifications

2. **Check Variant Storage**:
   - In Supabase, check `resume_variants` table
   - Should have new entry with `tailored_data`
   - Base resume in `resume_data` should be untouched

## Expected Behavior

✅ **Working Correctly If:**
- Analysis completes without timeout (within 60 seconds)
- Suggestions appear with Accept/Decline UI
- Skills are added/modified based on job requirements
- Base resume remains unchanged
- Variant is stored separately in database

❌ **Issues to Report:**
- "Failed" error on first click → Check console for specific error
- No suggestions showing → Check console for "Found 0 suggestions"
- Base resume modified → Critical bug, report immediately
- Timeout errors → May need to increase `maxDuration` further

## Debug Mode

To enable debug list view:
1. Open browser console
2. Run: `localStorage.setItem('SHOW_LIST_DEBUG', 'true')`
3. Refresh page
4. Debug panel will show in top-right corner

## Contact for Issues

If you encounter any issues:
1. Take screenshot of console errors
2. Note the job ID and time of test
3. Check Network tab for failed API calls
4. Report with all details

## Summary

The system should now:
- ✅ Use GPT-5 for analysis
- ✅ Complete within 60 seconds
- ✅ Show suggestions with Accept/Decline UI  
- ✅ Add relevant skills from job
- ✅ Keep base resume unchanged
- ✅ Store variants separately