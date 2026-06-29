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
  FriendRequest: 'friend_requests'
};

class SupabaseEntity {
  constructor(entityName) {
    this.entityName = entityName;
    this.tableName = TABLE_MAPPINGS[entityName] || entityName;
  }

  async list(orderBy = "", limit = 100) {
    try {
      let query = supabase.from(this.tableName).select('*');
      if (orderBy) {
        const desc = orderBy.startsWith("-");
        const field = desc ? orderBy.slice(1) : orderBy;
        query = query.order(field, { ascending: !desc });
      }
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error(`Error listing entity ${this.entityName}:`, e);
      return [];
    }
  }

  async filter(criteria = {}) {
    try {
      let query = supabase.from(this.tableName).select('*');
      for (const [key, value] of Object.entries(criteria)) {
        query = query.eq(key, value);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error(`Error filtering entity ${this.entityName}:`, e);
      return [];
    }
  }

  async get(id) {
    try {
      const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error(`Error getting entity ${this.entityName} with id ${id}:`, e);
      return null;
    }
  }

  async create(data) {
    try {
      // Keep original Mongo-like IDs for compatibility or custom items
      const newId = data.id || Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 8);
      const payload = { id: newId, ...data };
      const { data: created, error } = await supabase.from(this.tableName).insert([payload]).select().single();
      if (error) throw error;
      return created;
    } catch (e) {
      console.error(`Error creating entity ${this.entityName}:`, e);
      throw e;
    }
  }

  async update(id, data) {
    try {
      const { data: updated, error } = await supabase.from(this.tableName).update(data).eq('id', id).select().single();
      if (error) throw error;
      return updated;
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
          score: profile.score
        };
      }
      return user;
    },
    updateMe: async (data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: updated, error } = await supabase
        .from('profiles')
        .update(data)
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
