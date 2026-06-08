import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://cvvbnglujrinlorxkbfr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dmJuZ2x1anJpbmxvcnhrYmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Njk2NzksImV4cCI6MjA5NjQ0NTY3OX0.OX-gMECqN5ZB1FKsYhkcP6T-VEVW4CxnqGxgGSCvgWc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Components
export async function getComponents(type) {
  let query = supabase.from('components').select('*').order('name');
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Builds
export async function getBuilds() {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveBuild(build) {
  const { data, error } = await supabase
    .from('builds')
    .insert(build)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBuild(id) {
  const { error } = await supabase.from('builds').delete().eq('id', id);
  if (error) throw error;
}

// Support threads
export async function getThreads() {
  const { data, error } = await supabase
    .from('support_threads')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createThread(thread) {
  const { data, error } = await supabase
    .from('support_threads')
    .insert(thread)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateThreadStatus(id, status) {
  const { error } = await supabase
    .from('support_threads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function incrementThreadViews(id) {
  const { error } = await supabase.rpc('increment_thread_views', { thread_id: id }).maybeSingle();
  // Silently ignore if RPC doesn't exist
}

// Support messages
export async function getMessages(threadId) {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendMessage(message) {
  const { data, error } = await supabase
    .from('support_messages')
    .insert(message)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Benchmarks
export async function getBenchmarks(filters = {}) {
  let query = supabase.from('benchmarks').select('*').order('fps_avg', { ascending: false });
  if (filters.game) query = query.eq('game_title', filters.game);
  if (filters.gpu) query = query.eq('gpu_name', filters.gpu);
  if (filters.resolution) query = query.eq('resolution', filters.resolution);
  if (filters.quality) query = query.eq('quality', filters.quality);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function submitBenchmark(bench) {
  const { data, error } = await supabase
    .from('benchmarks')
    .insert(bench)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Error codes
export async function searchErrorCodes(query) {
  const { data, error } = await supabase
    .from('error_codes')
    .select('*')
    .or(`code.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('category')
    .limit(20);
  if (error) throw error;
  return data;
}

export async function getAllErrorCodes() {
  const { data, error } = await supabase
    .from('error_codes')
    .select('*')
    .order('category');
  if (error) throw error;
  return data;
}
