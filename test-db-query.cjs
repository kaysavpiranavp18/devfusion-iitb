const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fgptjwnkpbbjjbtlxnbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHRqd25rcGJiampidGx4bmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDM4NzcsImV4cCI6MjA5NTE3OTg3N30.qPgJ01Ootaq4z8eqIJRW4zQgU4e4GS8rRON4ymuGBV8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing frontend query on workspaces...');
  
  // Get a list of workspace IDs from workspace_members or workspaces
  const { data: memberRows } = await supabase
    .from('workspace_members')
    .select('workspace_id');
    
  const wsIds = (memberRows || []).map(r => r.workspace_id);
  console.log('Workspace IDs to query:', wsIds);
  
  if (wsIds.length === 0) {
    console.log('No workspace memberships found in DB.');
    return;
  }

  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members (
        role,
        joined_at,
        profiles (
          id,
          name,
          email,
          avatar,
          bio,
          skills,
          github,
          created_at
        )
      ),
      projects (
        id
      )
    `)
    .in('id', wsIds);

  if (error) {
    console.error('Frontend query error:', error);
  } else {
    console.log('Frontend query success! Data:');
    console.dir(data, { depth: null });
  }
}

run();
