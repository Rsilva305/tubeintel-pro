import { Competitor } from '@/types';
import { competitorListsApi } from './competitorLists';
import { getUseRealApi } from './config';

// This adapter connects the existing UI (which expects 'competitorsApi')
// to our new Supabase implementation (competitorListsApi)
// without requiring UI changes

// Cache for list name to ID mapping
const listIdCache: Record<string, string> = {};

export const competitorsAdapter = {
  // Get all competitors from a specific list (or default list)
  getAllCompetitors: async (): Promise<Competitor[]> => {
    try {
      if (!getUseRealApi()) {
        // Use the original mock implementation when in demo mode
        return (await import('./index')).competitorsApi.getAllCompetitors();
      }
      
      // Get all lists
      const lists = await competitorListsApi.getUserLists();
      
      // If no lists exist yet, create a default list
      if (lists.length === 0) {
        const defaultList = await competitorListsApi.createList({
          name: "All Competitors",
          description: "Default list for all tracked competitors",
          userId: 'current' // The API will use the current user ID
        });
        
        listIdCache["All Competitors"] = defaultList.id;
        return []; // Return empty array for now
      }
      
      // Get the first list (could be improved to use a dedicated "default" list)
      const defaultList = lists[0];
      listIdCache[defaultList.name] = defaultList.id;
      
      // Get all competitors from this list
      const trackedCompetitors = await competitorListsApi.getCompetitorsInList(defaultList.id);
      
      // Convert TrackedCompetitor to Competitor format
      return trackedCompetitors.map(tc => ({
        id: tc.id,
        youtubeId: tc.youtubeId,
        name: tc.name,
        thumbnailUrl: tc.thumbnailUrl || '',
        subscriberCount: tc.subscriberCount || 0,
        videoCount: tc.videoCount || 0,
        viewCount: tc.viewCount || 0
      }));
    } catch (error) {
      console.error('Error in competitorsAdapter.getAllCompetitors:', error);
      // Fallback to original implementation
      return (await import('./index')).competitorsApi.getAllCompetitors();
    }
  },
  
  // Get competitor by ID
  getCompetitorById: async (id: string): Promise<Competitor | null> => {
    try {
      if (!getUseRealApi()) {
        // Use the original mock implementation when in demo mode
        return (await import('./index')).competitorsApi.getCompetitorById(id);
      }
      
      // Since we don't have a direct way to get a competitor by ID,
      // we'd need to search through all lists
      const lists = await competitorListsApi.getUserLists();
      
      for (const list of lists) {
        const competitors = await competitorListsApi.getCompetitorsInList(list.id);
        const competitor = competitors.find(c => c.id === id);
        
        if (competitor) {
          return {
            id: competitor.id,
            youtubeId: competitor.youtubeId,
            name: competitor.name,
            thumbnailUrl: competitor.thumbnailUrl || '',
            subscriberCount: competitor.subscriberCount || 0,
            videoCount: competitor.videoCount || 0,
            viewCount: competitor.viewCount || 0
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in competitorsAdapter.getCompetitorById:', error);
      // Fallback to original implementation
      return (await import('./index')).competitorsApi.getCompetitorById(id);
    }
  },
  
  // Add a new competitor
  addCompetitor: async (data: Omit<Competitor, 'id'>): Promise<Competitor> => {
    try {
      if (!getUseRealApi()) {
        // Use the original mock implementation when in demo mode
        return (await import('./index')).competitorsApi.addCompetitor(data);
      }
      
      // Get all lists to find or create a default list
      let lists = await competitorListsApi.getUserLists();
      
      // Get or create default list
      let defaultListId: string;
      
      if (lists.length === 0) {
        const defaultList = await competitorListsApi.createList({
          name: "All Competitors",
          description: "Default list for all tracked competitors",
          userId: 'current' // The API will use the current user ID
        });
        
        defaultListId = defaultList.id;
        listIdCache["All Competitors"] = defaultListId;
      } else {
        defaultListId = lists[0].id;
        listIdCache[lists[0].name] = defaultListId;
      }
      
      // Add the competitor to the default list
      const trackedCompetitor = await competitorListsApi.addCompetitorToList(
        defaultListId,
        {
          youtubeId: data.youtubeId,
          name: data.name,
          thumbnailUrl: data.thumbnailUrl,
          subscriberCount: data.subscriberCount,
          videoCount: data.videoCount,
          viewCount: data.viewCount
        }
      );
      
      // Return in expected format
      return {
        id: trackedCompetitor.id,
        youtubeId: trackedCompetitor.youtubeId,
        name: trackedCompetitor.name,
        thumbnailUrl: trackedCompetitor.thumbnailUrl || '',
        subscriberCount: trackedCompetitor.subscriberCount || 0,
        videoCount: trackedCompetitor.videoCount || 0,
        viewCount: trackedCompetitor.viewCount || 0
      };
    } catch (error) {
      console.error('Error in competitorsAdapter.addCompetitor:', error);
      // Fallback to original implementation
      return (await import('./index')).competitorsApi.addCompetitor(data);
    }
  },
  
  // Remove a competitor
  removeCompetitor: async (id: string): Promise<void> => {
    try {
      if (!getUseRealApi()) {
        // Use the original mock implementation when in demo mode
        return (await import('./index')).competitorsApi.removeCompetitor(id);
      }
      
      // Remove the competitor using our new API
      await competitorListsApi.removeCompetitorFromList(id);
    } catch (error) {
      console.error('Error in competitorsAdapter.removeCompetitor:', error);
      // Fallback to original implementation
      return (await import('./index')).competitorsApi.removeCompetitor(id);
    }
  },
  
  // Get competitors for a specific named list
  getCompetitorsForList: async (listName: string): Promise<Competitor[]> => {
    try {
      if (!getUseRealApi()) {
        // In demo mode, just return all competitors
        return (await import('./index')).competitorsApi.getAllCompetitors();
      }
      
      // Try to get the list ID from cache
      let listId = listIdCache[listName];
      
      // If no cached ID, search for the list by name
      if (!listId) {
        const lists = await competitorListsApi.getUserLists();
        const list = lists.find(l => l.name === listName);
        
        if (list) {
          listId = list.id;
          listIdCache[listName] = listId;
        } else {
          // List not found - create it
          const newList = await competitorListsApi.createList({
            name: listName,
            description: `List for ${listName}`,
            userId: 'current' // The API will use the current user ID
          });
          
          listId = newList.id;
          listIdCache[listName] = listId;
          return []; // New list is empty
        }
      }
      
      // Get competitors for this list
      const trackedCompetitors = await competitorListsApi.getCompetitorsInList(listId);
      
      // Convert to expected format
      return trackedCompetitors.map(tc => ({
        id: tc.id,
        youtubeId: tc.youtubeId,
        name: tc.name,
        thumbnailUrl: tc.thumbnailUrl || '',
        subscriberCount: tc.subscriberCount || 0,
        videoCount: tc.videoCount || 0,
        viewCount: tc.viewCount || 0
      }));
    } catch (error) {
      console.error('Error in competitorsAdapter.getCompetitorsForList:', error);
      // Fallback to original implementation
      return (await import('./index')).competitorsApi.getAllCompetitors();
    }
  }
}; 