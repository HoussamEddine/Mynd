import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/supabase';

export interface DailyRitual {
  id: string;
  user_id: string;
  name: string;
  completed: boolean;
  time: string;
  duration: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  week_start_date: string; // ISO date string for the week
  created_at: string;
  updated_at: string;
  isDailySession?: boolean; // Flag to identify system-generated daily sessions
}

export interface DailyRitualInsert {
  id?: string;
  user_id: string;
  name: string;
  completed?: boolean;
  time: string;
  duration: string;
  day_of_week: number;
  week_start_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyRitualUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  completed?: boolean;
  time?: string;
  duration?: string;
  day_of_week?: number;
  week_start_date?: string;
  created_at?: string;
  updated_at?: string;
}

export class DailyRitualsService {
  // Get rituals for a specific week
  static async getRitualsForWeek(weekStartDate: string): Promise<DailyRitual[]> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('daily_rituals')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', weekStartDate)
        .order('day_of_week', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching rituals for week:', error);
      throw error;
    }
  }

  // Create a new ritual
  static async createRitual(ritual: Omit<DailyRitualInsert, 'user_id'>): Promise<DailyRitual> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const newRitual: DailyRitualInsert = {
        ...ritual,
        user_id: user.id,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('daily_rituals')
        .insert(newRitual)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating ritual:', error);
      throw error;
    }
  }

  // Update a ritual (toggle completion, update details, etc.)
  static async updateRitual(id: string, updates: Partial<DailyRitualUpdate>): Promise<DailyRitual> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const updateData: DailyRitualUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('daily_rituals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ritual:', error);
      throw error;
    }
  }

  // Toggle ritual completion
  static async toggleRitualCompletion(id: string): Promise<DailyRitual> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // First get the current ritual to toggle its completion status
      const { data: currentRitual, error: fetchError } = await supabase
        .from('daily_rituals')
        .select('completed')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('daily_rituals')
        .update({ 
          completed: !currentRitual.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling ritual completion:', error);
      throw error;
    }
  }

  // Delete a ritual
  static async deleteRitual(id: string): Promise<void> {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('daily_rituals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting ritual:', error);
      throw error;
    }
  }

  // Get week start date for a given date
  static getWeekStartDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return d.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  // Get day of week (0-6, Sunday-Saturday)
  static getDayOfWeek(date: Date): number {
    return date.getDay();
  }
} 