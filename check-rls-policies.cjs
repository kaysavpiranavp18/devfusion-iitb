const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fgptjwnkpbbjjbtlxnbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHRqd25rcGJiampidGx4bmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDM4NzcsImV4cCI6MjA5NTE3OTg3N30.qPgJ01Ootaq4z8eqIJRW4zQgU4e4GS8rRON4ymuGBV8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const projectId = 'dd9fe427-d5c3-4391-a84d-02650250a322';
  console.log(`Checking project_members for project: ${projectId}`);
  
  const { data: members, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching members:', error);
  } else {
    console.log(`Found ${members.length} member(s):`);
    console.dir(members, { depth: null });
  }
}

run();
