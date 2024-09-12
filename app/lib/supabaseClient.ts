import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// 環境変数が存在しない場合にエラーメッセージを出す
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL または API Key が設定されていません");
  }
  
  // Supabaseクライアントを作成
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);