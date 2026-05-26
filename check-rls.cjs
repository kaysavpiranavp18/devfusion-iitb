const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fgptjwnkpbbjjbtlxnbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHRqd25rcGJiampidGx4bmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDM4NzcsImV4cCI6MjA5NTE3OTg3N30.qPgJ01Ootaq4z8eqIJRW4zQgU4e4GS8rRON4ymuGBV8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying database tables and policies...');
  
  // We can execute raw SQL by querying pg_tables and pg_policies using an RPC,
  // but if we don't have an RPC, we can try to query profiles, workspaces, and workspace_members with a non-authenticated vs authenticated token
  // Let's check what policies or tables are present if we can.
  // Wait! In Supabase, if we want to run a raw SQL query, let's see if we have access to any RPC or if there's any other way.
  // Actually, we can run raw SQL queries if we can execute a request, but standard REST endpoint only allows table queries.
  // Let's test standard reads/writes on all major tables and see which ones fail and what errors they return!
  
  const tables = [
    'profiles',
    'plans',
    'workspaces',
    'workspace_members',
    'projects',
    'project_members',
    'tasks',
    'task_comments',
    'task_labels',
    'snippets',
    'snippet_tags',
    'wiki_pages',
    'wiki_page_versions',
    'activity_logs',
    'notifications'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table: ${table} - Fetch Error: ${error.code} - ${error.message}`);
    } else {
      console.log(`✅ Table: ${table} - Fetch Success (Found ${data.length} row(s))`);
    }
  }
}

run();
