const { supabase } = require("./supabase");

function credentials(body) {
  const email = body && typeof body.email === "string" ? body.email.trim() : "";
  const password = body && typeof body.password === "string" ? body.password : "";
  if (!email || password === "") {
    return null;
  }
  return { email, password };
}

async function signup(req, res, next) {
  try {
    const creds = credentials(req.body);
    if (!creds) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp(creds);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    if (!data.user) {
      return res.status(400).json({ error: "signup failed" });
    }

    res.status(201).json(data.user);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const creds = credentials(req.body);
    if (!creds) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword(creds);
    if (error || !data.session) {
      if (error) {
        console.error(error.message);
      }
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };
