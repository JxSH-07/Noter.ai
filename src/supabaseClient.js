// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qdkxbuqhzmrhfxudqpdi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka3hidXFoem1yaGZ4dWRxcGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjQxMzYsImV4cCI6MjA5MTE0MDEzNn0.aIr5y_36X6hrIoNhv7h06lUtT5aFY8q3gXiGW_6ILMw'

export const supabase = createClient(supabaseUrl, supabaseKey)
