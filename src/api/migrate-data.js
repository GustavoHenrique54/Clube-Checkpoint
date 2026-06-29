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

// 1. Mock localStorage globally so base44Client can load default datasets without crashing
const store = {};
globalThis.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = val; },
  removeItem: (key) => { delete store[key]; }
};

// Table mappings
const TABLES = {
  Badge: 'badges',
  PublicProfile: 'profiles',
  ClubHub: 'club_hub',
  ClubNews: 'news',
  ClubLink: 'links',
  UserBadge: 'user_badges',
  FriendRequest: 'friend_requests'
};

async function migrate() {
  console.log("🚀 Starting data migration from base44 mock to Supabase...");

  // 2. Import base44Client (mock DB) dynamically after localStorage is mocked
  const { default: base44Db } = await import('./base44Client.js');

  for (const [entityName, tableName] of Object.entries(TABLES)) {
    console.log(`\n📦 Processing entity [${entityName}] -> table [${tableName}]...`);

    // Get all records from local mock database
    const records = await base44Db.entities[entityName].list("", 5000);
    console.log(`Found ${records.length} records in local mock database.`);

    if (records.length === 0) {
      continue;
    }

    // Delete existing records to avoid conflicts
    console.log(`Cleaning existing records in table [${tableName}]...`);
    const { error: deleteError } = await supabase.from(tableName).delete().neq('id', 'dummy_nonexistent_id');
    if (deleteError) {
      console.warn(`⚠️ Warning clearing table ${tableName}:`, deleteError.message);
    }

    // Insert records in batches
    console.log(`Inserting ${records.length} records into table [${tableName}]...`);
    
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

    // Clean and map record fields to match actual Supabase columns
    const formattedRecords = records.map(record => {
      const copy = { ...record };
      
      // Map creation timestamp (except for club_hub which only has updated_at)
      if (record.created_date && tableName !== 'club_hub') {
        copy.created_at = record.created_date;
      }

      // profiles/PublicProfile adjustments
      if (tableName === 'profiles') {
        copy.id = record.user_id; // Set ID to the original user_id
        
        // Handle unique emails safely
        const emailVal = record.email || record.created_by;
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
      if (tableName === 'news') {
        if (record.created_by_id) {
          copy.created_by = record.created_by_id;
        }
      }

      // user_badges adjustments
      if (tableName === 'user_badges') {
        const comboKey = `${record.user_id}_${record.badge_id}`;
        if (seenUserBadges.has(comboKey)) {
          return null; // Skip duplicate badge entry
        }
        seenUserBadges.add(comboKey);
      }

      // Filter out any columns not present in the Postgres whitelist for this table
      const filtered = {};
      const allowedColumns = schemaWhitelists[tableName] || [];
      for (const col of allowedColumns) {
        if (copy[col] !== undefined) {
          filtered[col] = copy[col];
        }
      }

      return filtered;
    }).filter(Boolean);

    const { error: insertError } = await supabase.from(tableName).insert(formattedRecords);
    if (insertError) {
      console.error(`❌ Error inserting into ${tableName}:`, insertError);
    } else {
      console.log(`✅ Successfully migrated ${records.length} records into table [${tableName}].`);
    }
  }

  console.log("\n🎉 Database migration finished successfully!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Unexpected migration crash:", err);
  process.exit(1);
});
