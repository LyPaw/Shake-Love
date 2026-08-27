const SUPABASE_URL = 'https://aukcttjroidmbggmlzmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a2N0dGpyb2lkbWJnZ21sem1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTA5NTQsImV4cCI6MjEwMzQyNjk1NH0.JQ-QoswNabYzvrXI-xtBb9IfK0gUUGFp4hb0X90atW8';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function ensureAnonSession() {
    const { data } = await supabaseClient.auth.getSession();
    if (!data?.session) {
        const { error } = await supabaseClient.auth.signInAnonymously();
        if (error) throw error;
    }
}
