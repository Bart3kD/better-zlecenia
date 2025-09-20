import { supabase } from '@/utils/supabase/client';

export interface Category {
  id: string;
  name: string;
  icon: string;
  created_at: string;
}

export const categoriesService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    
    return data || [];
  },

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      console.error('Error fetching category:', error);
      throw error;
    }
    
    return data;
  },

  async searchCategories(query: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name');
    
    if (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
    
    return data || [];
  }
};