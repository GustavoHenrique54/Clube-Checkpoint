import db from './api/supabaseClient.js';
globalThis.__B44_DB__ = db;
console.log("Database initialized globally before App load.");
