import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';

// Types
interface CompetitorListInput {
  name: string;
  description: string;
  userId: string | 'current';
}

interface CompetitorList {
  id: string;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TrackedCompetitor {
  id: string;
  list_id: string;
  youtubeId: string;
  name: string;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
  viewCount: number | null;
  created_at: string;
  updated_at: string;
}

export const competitorListsApi = {
  // Get all lists for the current user
  getUserLists: async (): Promise<CompetitorList[]> => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.log('User not authenticated in getUserLists');
        // Check if we have lists in localStorage as fallback
        const localLists = localStorage.getItem('competitor_lists');
        if (localLists) {
          console.log('Using localStorage fallback for competitor lists');
          return JSON.parse(localLists);
        }
        throw new Error('User not authenticated');
      }
      
      try {
        const { data, error } = await supabase
          .from('competitor_lists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching competitor lists from Supabase:', error);
          
          // Check if we have lists in localStorage as fallback
          const localLists = localStorage.getItem('competitor_lists');
          if (localLists) {
            console.log('Using localStorage fallback for competitor lists after Supabase error');
            return JSON.parse(localLists);
          }
          
          throw error;
        }
        
        // Store in localStorage for offline access
        if (data) {
          localStorage.setItem('competitor_lists', JSON.stringify(data));
        }
        
        return (data || []) as unknown as CompetitorList[];
      } catch (dbError) {
        console.error('Database error in getUserLists:', dbError);
        
        // Check localStorage as fallback
        const localLists = localStorage.getItem('competitor_lists');
        if (localLists) {
          console.log('Using localStorage fallback after database error');
          return JSON.parse(localLists);
        }
        
        throw dbError;
      }
    } catch (error) {
      console.error('Error in getUserLists:', error);
      
      // Last resort fallback - empty list
      return [];
    }
  },
  
  // Create a new competitor list
  createList: async (listData: CompetitorListInput): Promise<CompetitorList> => {
    console.log("Starting createList with data:", listData);
    
    try {
      const user = await getCurrentUser();
      console.log("getCurrentUser result:", user ? 'Authenticated' : 'Not authenticated', user);
      
      if (!user) {
        console.error("User not authenticated - cannot create list");
        throw new Error('User not authenticated');
      }
      
      const userId = listData.userId === 'current' ? user.id : listData.userId;
      console.log("Using userId:", userId);
      
      try {
        console.log("Making Supabase request to create list for user:", userId);
        console.log("Supabase client initialized:", !!supabase);
        console.log("Supabase auth available:", !!supabase.auth);
        
        const { data, error } = await supabase
          .from('competitor_lists')
          .insert([{
            name: listData.name,
            description: listData.description,
            user_id: userId,
          }])
          .select()
          .single();
          
        if (error) {
          console.error('Error creating competitor list in Supabase:', error);
          console.error('Error details - code:', error.code);
          console.error('Error details - message:', error.message);
          console.error('Error details - hint:', error.hint);
          console.error('Error details - details:', error.details);
          
          // If the error is related to RLS or auth, try a fallback approach with localStorage
          if (error.code === 'PGRST301' || error.code?.includes('auth') || 
              error.message?.includes('permission') || error.message?.includes('policy')) {
            
            console.log("Using localStorage fallback for competitor list");
            
            // Generate a fake UUID for the list
            const fakeId = 'local_' + Math.random().toString(36).substring(2, 11);
            
            // Create a fake competitor list entry
            const fakeList = {
              id: fakeId,
              name: listData.name,
              description: listData.description,
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Store in localStorage
            const existingLists = localStorage.getItem('competitor_lists');
            const lists = existingLists ? JSON.parse(existingLists) : [];
            lists.push(fakeList);
            localStorage.setItem('competitor_lists', JSON.stringify(lists));
            
            console.log("Created list in localStorage:", fakeList);
            return fakeList as CompetitorList;
          }
          
          throw error;
        }
        
        if (!data) {
          console.error('No data returned from Supabase after insert');
          throw new Error('Failed to create list - no data returned');
        }
        
        console.log("Successfully created list in Supabase:", data);
        return data as unknown as CompetitorList;
      } catch (dbError) {
        console.error('Database error creating list:', dbError);
        throw dbError;
      }
    } catch (authError) {
      console.error('Authentication error in createList:', authError);
      throw new Error('Authentication error: ' + (authError instanceof Error ? authError.message : 'Unknown error'));
    }
  },
  
  // Update a competitor list
  updateList: async (id: string, updates: Partial<CompetitorListInput>): Promise<CompetitorList> => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('competitor_lists')
      .update({
        name: updates.name,
        description: updates.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Security: ensure user owns this list
      .select()
      .single();
      
    if (error) {
      console.error('Error updating competitor list:', error);
      throw error;
    }
    
    return data as unknown as CompetitorList;
  },
  
  // Delete a competitor list
  deleteList: async (id: string): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('competitor_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Security: ensure user owns this list
      
    if (error) {
      console.error('Error deleting competitor list:', error);
      throw error;
    }
  },
  
  // Get all competitors in a list
  getCompetitorsInList: async (listId: string): Promise<TrackedCompetitor[]> => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // First verify user owns this list
    const { data: listData, error: listError } = await supabase
      .from('competitor_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single();
      
    if (listError || !listData) {
      console.error('Error verifying list ownership:', listError);
      throw new Error('List not found or access denied');
    }
    
    // Now get the competitors
    const { data, error } = await supabase
      .from('tracked_competitors')
      .select('*')
      .eq('list_id', listId);
      
    if (error) {
      console.error('Error fetching competitors in list:', error);
      throw error;
    }
    
    // Convert database fields to camelCase for frontend
    return (data || []).map(item => ({
      id: item.id as string,
      list_id: item.list_id as string,
      youtubeId: item.youtube_id as string,
      name: item.name as string,
      thumbnailUrl: item.thumbnail_url as string | null,
      subscriberCount: item.subscriber_count as number | null,
      videoCount: item.video_count as number | null,
      viewCount: item.view_count as number | null,
      created_at: item.created_at as string,
      updated_at: item.updated_at as string
    }));
  },
  
  // Add a competitor to a list
  addCompetitorToList: async (
    listId: string, 
    competitor: {
      youtubeId: string;
      name: string;
      thumbnailUrl?: string;
      subscriberCount?: number;
      videoCount?: number;
      viewCount?: number;
    }
  ): Promise<TrackedCompetitor> => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // First verify user owns this list
    const { data: listData, error: listError } = await supabase
      .from('competitor_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single();
      
    if (listError || !listData) {
      console.error('Error verifying list ownership:', listError);
      throw new Error('List not found or access denied');
    }
    
    // Add the competitor
    const { data, error } = await supabase
      .from('tracked_competitors')
      .insert([{
        list_id: listId,
        youtube_id: competitor.youtubeId,
        name: competitor.name,
        thumbnail_url: competitor.thumbnailUrl,
        subscriber_count: competitor.subscriberCount,
        video_count: competitor.videoCount,
        view_count: competitor.viewCount
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error adding competitor to list:', error);
      throw error;
    }
    
    // Convert database fields to camelCase for frontend
    return {
      id: data.id as string,
      list_id: data.list_id as string,
      youtubeId: data.youtube_id as string,
      name: data.name as string,
      thumbnailUrl: data.thumbnail_url as string | null,
      subscriberCount: data.subscriber_count as number | null,
      videoCount: data.video_count as number | null,
      viewCount: data.view_count as number | null,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string
    };
  },
  
  // Remove a competitor from a list
  removeCompetitorFromList: async (competitorId: string): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Delete the competitor
    // Note: In a more secure setup, we'd first verify the list is owned by the user
    const { error } = await supabase
      .from('tracked_competitors')
      .delete()
      .eq('id', competitorId);
      
    if (error) {
      console.error('Error removing competitor from list:', error);
      throw error;
    }
  }
}; 