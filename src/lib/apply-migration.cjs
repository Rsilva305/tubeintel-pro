const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection details - these should come from your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Role Key is missing.');
  console.error('Make sure to set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    // Path to the migration file
    const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20240602000000_add_has_completed_onboarding_column.sql');
    
    // Read the migration file
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration...');
    console.log(sql);
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      return;
    }
    
    console.log('Migration applied successfully!');
    
    // Verify the column was added
    const { data, error: verifyError } = await supabase
      .from('profiles')
      .select('has_completed_onboarding')
      .limit(1);
    
    if (verifyError) {
      console.error('Error verifying migration:', verifyError);
      return;
    }
    
    console.log('Column verification:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration(); 