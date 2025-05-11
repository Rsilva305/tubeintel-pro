# PowerShell script to provide guidance on fixing the onboarding issue

Write-Host "`nTubeIntel Pro - Fix Onboarding Column`n" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if running in PowerShell
if (-Not $PSVersionTable) {
    Write-Host "This script requires PowerShell to run." -ForegroundColor Red
    exit 1
}

Write-Host "`nThis script will guide you through fixing the missing 'has_completed_onboarding' column.`n"

# Display instructions for running the SQL
Write-Host "To fix the issue, please follow these steps:`n" -ForegroundColor Yellow

Write-Host "1. Go to your Supabase Dashboard at https://app.supabase.com/"
Write-Host "2. Select your project"
Write-Host "3. Go to the SQL Editor"
Write-Host "4. Create a new query"
Write-Host "5. Copy and paste the SQL below:`n"

$sqlFix = @"
-- Add the has_completed_onboarding column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Update existing profiles
-- If a profile has a youtube_channel_id, consider it as having completed onboarding
UPDATE public.profiles 
SET has_completed_onboarding = true 
WHERE youtube_channel_id IS NOT NULL AND youtube_channel_id != '';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'has_completed_onboarding';
"@

Write-Host $sqlFix -ForegroundColor Green
Write-Host "`n6. Click 'Run' to execute the SQL"
Write-Host "7. Refresh your application - the onboarding error should be fixed`n"

# Ask if user wants to save SQL to a file
$answer = Read-Host "Would you like to save this SQL to a file for easy copying? (Y/N)"

if ($answer -eq "Y" -or $answer -eq "y") {
    $filePath = Join-Path $PWD "fix-onboarding.sql"
    
    try {
        $sqlFix | Out-File -FilePath $filePath -Encoding utf8
        Write-Host "`nSQL saved to:" -ForegroundColor Green
        Write-Host $filePath
        Write-Host "`nYou can open this file in any text editor to copy the SQL.`n"
    } catch {
        Write-Host "`nError saving the file: $_" -ForegroundColor Red
    }
} else {
    Write-Host "`nCopy the SQL above and run it in your Supabase SQL Editor.`n"
}

Write-Host "After running the SQL, your onboarding page should work correctly.`n" -ForegroundColor Cyan 