const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fgptjwnkpbbjjbtlxnbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncHRqd25rcGJiampidGx4bmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDM4NzcsImV4cCI6MjA5NTE3OTg3N30.qPgJ01Ootaq4z8eqIJRW4zQgU4e4GS8rRON4ymuGBV8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting DB Write Tests on all tables...');

  // Use a valid profile ID from the profiles table
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
  if (pError || !profiles || profiles.length === 0) {
    console.error('❌ Failed to get a profile ID:', pError);
    return;
  }
  const userId = profiles[0].id;
  console.log(`Using Profile ID: ${userId}`);

  let workspaceId = null;
  let projectId = null;
  let taskId = null;
  let snippetId = null;
  let docId = null;

  // 1. Insert Workspace
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        name: 'Write Test Workspace',
        description: 'Testing write access',
        owner_id: userId,
        plan: 'free'
      })
      .select()
      .single();
    if (error) throw error;
    workspaceId = data.id;
    console.log('✅ Workspace Insert Success, ID:', workspaceId);
  } catch (err) {
    console.error('❌ Workspace Insert Failed:', err.message || err);
  }

  if (!workspaceId) return;

  // 2. Insert Workspace Member
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: 'owner'
      })
      .select()
      .single();
    if (error) throw error;
    console.log('✅ Workspace Member Insert Success, ID:', data.id);
  } catch (err) {
    console.error('❌ Workspace Member Insert Failed:', err.message || err);
  }

  // 3. Insert Project
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        workspace_id: workspaceId,
        name: 'Write Test Project',
        description: 'Testing project insertion',
        color: '#6366f1'
      })
      .select()
      .single();
    if (error) throw error;
    projectId = data.id;
    console.log('✅ Project Insert Success, ID:', projectId);
  } catch (err) {
    console.error('❌ Project Insert Failed:', err.message || err);
  }

  if (!projectId) return;

  // 4. Insert Project Member
  try {
    const { data, error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: 'owner'
      })
      .select()
      .single();
    if (error) throw error;
    console.log('✅ Project Member Insert Success, ID:', data.id);
  } catch (err) {
    console.error('❌ Project Member Insert Failed:', err.message || err);
  }

  // 5. Insert Task
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        title: 'Write Test Task',
        description: 'Testing task insertion',
        status: 'todo',
        priority: 'p1',
        assignee_id: userId,
        task_order: 1,
        created_by: userId
      })
      .select()
      .single();
    if (error) throw error;
    taskId = data.id;
    console.log('✅ Task Insert Success, ID:', taskId);
  } catch (err) {
    console.error('❌ Task Insert Failed:', err.message || err);
  }

  // 6. Insert Task Label
  if (taskId) {
    try {
      const { data, error } = await supabase
        .from('task_labels')
        .insert({
          task_id: taskId,
          label: 'TestLabel'
        })
        .select()
        .single();
      if (error) throw error;
      console.log('✅ Task Label Insert Success, ID:', data.id);
    } catch (err) {
      console.error('❌ Task Label Insert Failed:', err.message || err);
    }
  }

  // 7. Insert Task Comment
  if (taskId) {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          content: 'Test comment'
        })
        .select()
        .single();
      if (error) throw error;
      console.log('✅ Task Comment Insert Success, ID:', data.id);
    } catch (err) {
      console.error('❌ Task Comment Insert Failed:', err.message || err);
    }
  }

  // 8. Insert Snippet
  try {
    const { data, error } = await supabase
      .from('snippets')
      .insert({
        project_id: projectId,
        title: 'Test Snippet',
        filename: 'test.js',
        code: 'console.log("hello");',
        language: 'javascript',
        description: 'Test snippet description',
        created_by: userId
      })
      .select()
      .single();
    if (error) throw error;
    snippetId = data.id;
    console.log('✅ Snippet Insert Success, ID:', snippetId);
  } catch (err) {
    console.error('❌ Snippet Insert Failed:', err.message || err);
  }

  // 9. Insert Snippet Tag
  if (snippetId) {
    try {
      const { data, error } = await supabase
        .from('snippet_tags')
        .insert({
          snippet_id: snippetId,
          tag: 'test'
        })
        .select()
        .single();
      if (error) throw error;
      console.log('✅ Snippet Tag Insert Success, ID:', data.id);
    } catch (err) {
      console.error('❌ Snippet Tag Insert Failed:', err.message || err);
    }
  }

  // 10. Insert Wiki Page
  try {
    const { data, error } = await supabase
      .from('wiki_pages')
      .insert({
        project_id: projectId,
        title: 'Test Wiki',
        content: 'Test content',
        created_by: userId
      })
      .select()
      .single();
    if (error) throw error;
    docId = data.id;
    console.log('✅ Wiki Page Insert Success, ID:', docId);
  } catch (err) {
    console.error('❌ Wiki Page Insert Failed:', err.message || err);
  }

  // 11. Insert Wiki Page Version
  if (docId) {
    try {
      const { data, error } = await supabase
        .from('wiki_page_versions')
        .insert({
          wiki_page_id: docId,
          version: 1,
          content: 'Test content version 1',
          updated_by: userId
        })
        .select()
        .single();
      if (error) throw error;
      console.log('✅ Wiki Page Version Insert Success, ID:', data.id);
    } catch (err) {
      console.error('❌ Wiki Page Version Insert Failed:', err.message || err);
    }
  }

  // 12. Insert Activity Log
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        type: 'task_created',
        message: 'Created a test task',
        user_id: userId
      })
      .select()
      .single();
    if (error) throw error;
    console.log('✅ Activity Log Insert Success, ID:', data.id);
  } catch (err) {
    console.error('❌ Activity Log Insert Failed:', err.message || err);
  }

  // Clean up
  console.log('Cleaning up write tests...');
  await supabase.from('workspaces').delete().eq('id', workspaceId);
  console.log('Clean up finished.');
}

run();
