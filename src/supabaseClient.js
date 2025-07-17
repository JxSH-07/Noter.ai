// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gkklfyvmhxulxdwjmjxz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2xmeXZtaHh1bHhkd2ptanh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNDUwNDUsImV4cCI6MjA1OTkyMTA0NX0.bBJGZ1ORgqO0iAIzA4aoJPn9LDgYQ1BdfMj6vO4XaZA'

export const supabase = createClient(supabaseUrl, supabaseKey)
