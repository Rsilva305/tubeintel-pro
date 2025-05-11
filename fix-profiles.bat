@echo off
echo ===============================================
echo TubeIntel Pro - Profile Fix Helper
echo ===============================================
echo:
echo This script will help you apply the SQL fix to resolve
echo the "Failed to update profile" error.
echo:
echo Steps:
echo 1. Open your Supabase Dashboard
echo 2. Go to SQL Editor
echo 3. Create a new query
echo 4. Copy the SQL below and paste it into the SQL Editor
echo 5. Run the query
echo:
echo ===============================================
echo SQL to run:
echo ===============================================
echo:
type src\lib\profile-fix.sql
echo:
echo ===============================================
echo After running this SQL, restart your application
echo and try connecting your YouTube channel again.
echo:
pause 