// Script to migrate/seed data from local base44Client.js mock databases into Supabase.
// Run this command: node src/api/migrate-data.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read env variables manually from .env.local
const envPath = path.resolve(__dirname, '../../.env.local');
const env = {};
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if present
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
        value = value.substring(1, value.length - 1);
      }
      env[key] = value.trim();
    }
  });
} catch (e) {
  console.warn("⚠️ Warning: Could not read .env.local file. Checking process.env instead.");
}

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in your .env.local file.");
  process.exit(1);
}

console.log("Connecting to Supabase at:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to parse CSV properly (handling newlines and quotes inside cells)
function parseCSV(csvText) {
  const result = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i+1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(cell);
        result.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
    result.push(row);
  }
  return result;
}

// Load real emails map from User_export.csv
const userEmails = {};
try {
  const userCsvPath = path.resolve(__dirname, '../../Dados exportados do BASE44/User_export.csv');
  const userCsvContent = fs.readFileSync(userCsvPath, 'utf-8');
  const parsedUsers = parseCSV(userCsvContent);
  
  // Find column indices
  const headers = parsedUsers[0] || [];
  const idIndex = headers.indexOf('id');
  const emailIndex = headers.indexOf('email');
  
  if (idIndex !== -1 && emailIndex !== -1) {
    for (let i = 1; i < parsedUsers.length; i++) {
      const row = parsedUsers[i];
      if (row[idIndex] && row[emailIndex]) {
        userEmails[row[idIndex].trim()] = row[emailIndex].trim();
      }
    }
    console.log(`Loaded ${Object.keys(userEmails).length} true email mappings from User_export.csv.`);
  }
} catch (e) {
  console.warn("⚠️ Warning: Could not parse User_export.csv for real email mapping. Falling back to default profile emails.", e.message);
}

// 1. Mock localStorage globally so base44Client can load default datasets without crashing
const store = {};
globalThis.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = val; },
  removeItem: (key) => { delete store[key]; }
};

// Table mappings ordered by dependency (parents first, children last for inserts; cleanups run in reverse)
const TABLES = [
  { entity: 'Badge', table: 'badges' },
  { entity: 'PublicProfile', table: 'profiles' },
  { entity: 'ClubHub', table: 'club_hub' },
  { entity: 'ClubLink', table: 'links' },
  { entity: 'ClubNews', table: 'news' },
  { entity: 'UserBadge', table: 'user_badges' },
  { entity: 'FriendRequest', table: 'friend_requests' }
];

async function migrate() {
  console.log("🚀 Starting data migration from base44 mock to Supabase...");

  // 2. Import base44Client (mock DB) dynamically after localStorage is mocked
  const { default: base44Db } = await import('./base44Client.js');

  // One cleanup loop backwards to avoid foreign key errors
  console.log("\n🧹 Cleaning existing data in correct dependency order...");
  for (let i = TABLES.length - 1; i >= 0; i--) {
    const { table } = TABLES[i];
    console.log(`Cleaning table [${table}]...`);
    const { error: deleteError } = await supabase.from(table).delete().neq('id', 'dummy_nonexistent_id');
    if (deleteError) {
      console.warn(`⚠️ Warning clearing table ${table}:`, deleteError.message);
    }
  }

  // Define Whitelists of columns for each table to ensure we do not send any unsupported columns
  const schemaWhitelists = {
    profiles: ['id', 'supabase_uid', 'email', 'username', 'display_name', 'profile_image', 'cover_image', 'bio', 'instagram', 'discord', 'steam', 'psn_username', 'xbox_username', 'role', 'games_completed', 'meetings_attended', 'score', 'created_at', 'featured_badges'],
    badges: ['id', 'name', 'icon_image', 'description', 'category', 'rarity', 'is_secret', 'created_at'],
    user_badges: ['id', 'user_id', 'badge_id', 'created_at'],
    news: ['id', 'title', 'excerpt', 'content', 'cover_image', 'is_published', 'created_at', 'created_by'],
    links: ['id', 'title', 'url', 'description', 'emoji', 'created_at'],
    club_hub: ['id', 'active_game_title', 'active_game_description', 'active_game_image', 'meeting_date', 'meeting_time', 'meeting_location'],
    friend_requests: ['id', 'sender_user_id', 'receiver_user_id', 'status', 'created_at']
  };

  const usedEmails = new Set();
  const seenUserBadges = new Set();

  // One insert loop forward
  for (const { entity, table } of TABLES) {
    console.log(`\n📦 Processing entity [${entity}] -> table [${table}]...`);

    // Get all records from local mock database
    const records = await base44Db.entities[entity].list("", 5000);
    console.log(`Found ${records.length} records in local mock database.`);

    if (records.length === 0) {
      continue;
    }

    // Clean and map record fields to match actual Supabase columns
    const formattedRecords = records.map(record => {
      const copy = { ...record };
      
      // Map creation timestamp (except for club_hub which only has updated_at)
      if (record.created_date && table !== 'club_hub') {
        copy.created_at = record.created_date;
      }

      // profiles/PublicProfile adjustments
      if (table === 'profiles') {
        copy.id = record.user_id; // Set ID to the original user_id
        
        // Handle unique emails safely (looking up the real email from User_export.csv first)
        const emailVal = userEmails[record.user_id] || record.email || record.created_by;
        if (emailVal && emailVal.trim() !== "") {
          const cleanEmail = emailVal.trim().toLowerCase();
          if (!usedEmails.has(cleanEmail)) {
            copy.email = cleanEmail;
            usedEmails.add(cleanEmail);
          } else {
            copy.email = null;
          }
        } else {
          copy.email = null;
        }

        // Set empty username to null to prevent unique constraint conflicts in Postgres
        if (!record.username || record.username.trim() === "") {
          copy.username = null;
        } else {
          copy.username = record.username.trim().toLowerCase();
        }

        // Parse or stringify featured_badges to ensure compatibility
        if (record.featured_badges && typeof record.featured_badges !== 'string') {
          copy.featured_badges = JSON.stringify(record.featured_badges);
        }
      }

      // news/ClubNews adjustments
      if (table === 'news') {
        if (record.created_by_id) {
          copy.created_by = record.created_by_id;
        }
      }

      // user_badges adjustments
      if (table === 'user_badges') {
        const comboKey = `${record.user_id}_${record.badge_id}`;
        if (seenUserBadges.has(comboKey)) {
          return null; // Skip duplicate badge entry
        }
        seenUserBadges.add(comboKey);
      }

      // Filter out any columns not present in the Postgres whitelist for this table
      const filtered = {};
      const allowedColumns = schemaWhitelists[table] || [];
      for (const col of allowedColumns) {
        if (copy[col] !== undefined) {
          filtered[col] = copy[col];
        }
      }

      return filtered;
    }).filter(Boolean);

    console.log(`Inserting ${formattedRecords.length} records into table [${table}]...`);
    const { error: insertError } = await supabase.from(table).insert(formattedRecords);
    if (insertError) {
      console.error(`❌ Error inserting into ${table}:`, insertError);
    } else {
      console.log(`✅ Successfully migrated ${formattedRecords.length} records into table [${table}].`);
    }
  }

  console.log("\n🎉 Database migration finished successfully!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Unexpected migration crash:", err);
  process.exit(1);
});
