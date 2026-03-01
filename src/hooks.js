import { supabase } from './supabase';

export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error('Error fetching profiles:', error);
  return data || [];
}

export async function getProfile(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) console.error('Error fetching profile:', error);
  return data;
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error updating profile:', error);
  return data;
}

export async function getBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error('Error fetching businesses:', error);
  return data || [];
}

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error('Error fetching projects:', error);
  return data || [];
}

export async function getJobs(filters = {}) {
  let query = supabase
    .from('jobs')
    .select('*, businesses(name, logo_url)')
    .eq('is_active', true)
    .order('posted_at', { ascending: false });

  if (filters.type) query = query.eq('type', filters.type);
  if (filters.location) query = query.ilike('location', `%${filters.location}%`);
  if (filters.salaryMin) query = query.gte('salary_max', filters.salaryMin);
  if (filters.salaryMax) query = query.lte('salary_min', filters.salaryMax);

  const { data, error } = await query;
  if (error) console.error('Error fetching jobs:', error);
  return data || [];
}

export async function getManufacturers() {
  const { data, error } = await supabase
    .from('manufacturers')
    .select('*')
    .order('name');
  if (error) console.error('Error fetching manufacturers:', error);
  return data || [];
}

export async function getMessages(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(full_name, avatar_url), receiver:profiles!receiver_id(full_name, avatar_url)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: true });
  if (error) console.error('Error fetching messages:', error);
  return data || [];
}

export async function sendMessage(senderId, receiverId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select()
    .single();
  if (error) console.error('Error sending message:', error);
  return data;
}