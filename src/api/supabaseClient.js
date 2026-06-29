import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found in env variables! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel settings.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Map Base44 entity names to Supabase table names
const TABLE_MAPPINGS = {
  PublicProfile: 'profiles',
  Badge: 'badges',
  UserBadge: 'user_badges',
  ClubNews: 'news',
  ClubLink: 'links',
  ClubHub: 'club_hub',
  FriendRequest: 'friend_requests',
  ConsideredGame: 'considered_games'
};

class SupabaseEntity {
  constructor(entityName) {
    this.entityName = entityName;
    this.tableName = TABLE_MAPPINGS[entityName] || entityName;
  }

  // Helper to format record going out to the app (parsing arrays, setting compatibility fields)
  _formatOut(record) {
    if (!record) return null;
    const copy = { ...record };
    
    // Add created_date alias for backward compatibility (old code references created_date)
    if (record.created_at && !record.created_date) {
      copy.created_date = record.created_at;
    }
    
    // Add user_id for profile compatibility
    if (this.tableName === 'profiles') {
      copy.user_id = record.id;
      
      // Parse featured_badges if stored as text
      if (typeof record.featured_badges === 'string') {
        try {
          copy.featured_badges = JSON.parse(record.featured_badges);
        } catch (e) {
          copy.featured_badges = [];
        }
      } else if (!record.featured_badges) {
        copy.featured_badges = [];
      }
    }
    return copy;
  }

  // Helper to format payload going into the DB (serializing arrays, stripping non-existent fields)
  _formatIn(data) {
    const copy = { ...data };
    if (this.tableName === 'profiles') {
      // Remove compatibility field user_id (the DB column is 'id')
      delete copy.user_id;

      // Stringify featured_badges if it is an array/object
      if (copy.featured_badges && typeof copy.featured_badges !== 'string') {
        copy.featured_badges = JSON.stringify(copy.featured_badges);
      }
    }
    return copy;
  }

  async list(orderBy = "", limit = 100) {
    try {
      let query = supabase.from(this.tableName).select('*');
      if (orderBy) {
        const desc = orderBy.startsWith("-");
        let field = desc ? orderBy.slice(1) : orderBy;
        if (field === 'created_date') {
          field = 'created_at';
        }
        query = query.order(field, { ascending: !desc });
      }
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return (data || []).map(r => this._formatOut(r));
    } catch (e) {
      console.error(`Error listing entity ${this.entityName}:`, e);
      return [];
    }
  }

  async filter(criteria = {}) {
    try {
      let query = supabase.from(this.tableName).select('*');
      for (const [key, value] of Object.entries(criteria)) {
        if (this.tableName === 'profiles' && key === 'user_id') {
          query = query.eq('id', value);
        } else {
          query = query.eq(key, value);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(r => this._formatOut(r));
    } catch (e) {
      console.error(`Error filtering entity ${this.entityName}:`, e);
      return [];
    }
  }

  async get(id) {
    try {
      const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return this._formatOut(data);
    } catch (e) {
      console.error(`Error getting entity ${this.entityName} with id ${id}:`, e);
      return null;
    }
  }

  async create(data) {
    try {
      const newId = data.id || Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 8);
      const payload = this._formatIn({ id: newId, ...data });
      const { data: created, error } = await supabase.from(this.tableName).insert([payload]).select().single();
      if (error) throw error;
      return this._formatOut(created);
    } catch (e) {
      console.error(`Error creating entity ${this.entityName}:`, e);
      throw e;
    }
  }

  async update(id, data) {
    try {
      const payload = this._formatIn(data);
      const { data: updated, error } = await supabase.from(this.tableName).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return this._formatOut(updated);
    } catch (e) {
      console.error(`Error updating entity ${this.entityName} with id ${id}:`, e);
      throw e;
    }
  }

  async delete(id) {
    try {
      const { error } = await supabase.from(this.tableName).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error(`Error deleting entity ${this.entityName} with id ${id}:`, e);
      throw e;
    }
  }
}

export const db = {
  auth: {
    isAuthenticated: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session !== null;
    },
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Find public profile linked to this user's email
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (error) {
        console.error("Error retrieving public profile:", error);
      }

      if (profile) {
        // Parse featured_badges if stored as JSON string
        let featuredBadges = profile.featured_badges;
        if (typeof featuredBadges === 'string') {
          try { featuredBadges = JSON.parse(featuredBadges); } catch { featuredBadges = []; }
        }
        if (!featuredBadges) featuredBadges = [];

        return {
          ...user,
          id: profile.id, // Override with original 24-character profile ID for relation mapping
          role: profile.role,
          username: profile.username,
          display_name: profile.display_name,
          profile_image: profile.profile_image,
          cover_image: profile.cover_image,
          bio: profile.bio,
          instagram: profile.instagram,
          discord: profile.discord,
          steam: profile.steam,
          psn_username: profile.psn_username,
          xbox_username: profile.xbox_username,
          games_completed: profile.games_completed,
          meetings_attended: profile.meetings_attended,
          score: profile.score,
          featured_badges: featuredBadges
        };
      }
      return user;
    },
    updateMe: async (data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Clean and format payload before sending to Supabase
      const payload = { ...data };
      
      // Remove compatibility field (the DB column is 'id', not 'user_id')
      delete payload.user_id;

      // Stringify featured_badges if it's an array/object
      if (payload.featured_badges && typeof payload.featured_badges !== 'string') {
        payload.featured_badges = JSON.stringify(payload.featured_badges);
      }

      // Strip undefined values to avoid overwriting with null
      for (const key of Object.keys(payload)) {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      }

      const { data: updated, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('email', user.email)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      return { ...user, ...updated, id: updated.id };
    },
    logout: async () => {
      await supabase.auth.signOut();
      return { success: true };
    },
    redirectToLogin: (fromUrl) => {
      // Redirect locally or push to /login route
      window.location.href = `/login?redirect=${encodeURIComponent(fromUrl || '')}`;
    }
  },
  entities: new Proxy({}, {
    get: (target, name) => {
      return new SupabaseEntity(name);
    }
  }),
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        // Upload images/covers to Supabase storage bucket 'uploads'
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `user_assets/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);

        if (uploadError) {
          // Fallback to local preview URL if bucket is not configured yet
          console.warn("Storage upload failed (bucket 'uploads' might not be configured). Falling back to temporary local blob URL.", uploadError);
          const localUrl = URL.createObjectURL(file);
          return { file_url: localUrl };
        }

        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
        return { file_url: data.publicUrl };
      }
    }
  }
};

export const base44 = db;
export default db;
