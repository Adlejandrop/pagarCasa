function getEnvValue(name) {
	if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name];
	if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[name]) return window.__ENV__[name];
	if (typeof window !== 'undefined' && typeof window[name] !== 'undefined') return window[name];
	return null;
}

const SUPABASE_URL = getEnvValue('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvValue('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY in environment or inject window.__ENV__.');
}

const supabaseClient = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
	? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
	: null;

if (typeof window !== 'undefined') window.supabaseClient = supabaseClient;