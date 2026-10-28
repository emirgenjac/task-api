const { createClient } = require("@supabase/supabase-js");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const supabaseUrl = requireEnv("SUPABASE_URL");
const supabaseKey = requireEnv("SUPABASE_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

async function connectSupabase() {
  const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase auth health returned ${response.status}`);
  }
}

module.exports = { supabase, connectSupabase };
