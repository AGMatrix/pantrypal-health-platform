// lib/database.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

export interface DatabaseUserData {
  id: string;
  user_id: string;
  favorites: string[];
  shopping_list: any[];
  search_history: string[];
  preferences: any;
  updated_at: string;
}

// Test database connection
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    return { success: !error, error: error?.message };
  } catch (error) {
    // Properly handle unknown error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return { success: false, error: errorMessage };
  }
}