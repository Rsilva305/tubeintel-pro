'use client';

import { useState, useRef, useEffect } from 'react';
import { competitorsApi } from '@/services/api';
import { Competitor } from '@/types';
import { getUseRealApi } from '@/services/api/config';
import { FaPlus, FaTimes, FaEllipsisV, FaThumbtack, FaPencilAlt, FaCopy, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// New interface for competitor lists
interface CompetitorList {
  id: string;
  name: string;
  isPinned: boolean;
  competitors: Competitor[];
}

export default function CompetitorsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [competitorLists, setCompetitorLists] = useState<CompetitorList[]>([]);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useRealApi] = useState(getUseRealApi());
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  // Load competitor data
  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        // For demonstration, we'll create a single default list with all competitors
        const competitors = await competitorsApi.getAllCompetitors();
        
        // Only create the default list if we don't have any lists yet
        if (competitorLists.length === 0) {
          setCompetitorLists([
            {
              id: "default",
              name: "All Competitors",
              isPinned: true,
              competitors: competitors
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching competitors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitors();
  }, []);

  const openModal = (listId?: string) => {
    if (listId !== undefined) {
      setEditingListId(listId);
      const list = competitorLists.find(l => l.id === listId);
      if (list) setListName(list.name);
    } else {
      setEditingListId(null);
      setListName('');
    }
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setListName('');
    setEditingListId(null);
  }

  const handleSave = () => {
    if (listName.trim()) {
      if (editingListId !== null) {
        // Update existing list
        setCompetitorLists(
          competitorLists.map(list => 
            list.id === editingListId 
              ? { ...list, name: listName } 
              : list
          )
        );
      } else {
        // Create new list
        const newListId = Date.now().toString();
        const newList = {
          id: newListId,
          name: listName,
          isPinned: false,
          competitors: []
        };
        setCompetitorLists([...competitorLists, newList]);
        
        // Optionally navigate to the new list after creation
        setTimeout(() => {
          router.push(`/dashboard/competitors/${newListId}?name=${encodeURIComponent(listName)}`);
        }, 300);
      }
      setListName('');
      closeModal();
    }
  }

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  }

  const closeAllMenus = () => {
    setOpenMenuId(null);
  }

  const pinList = (id: string) => {
    setCompetitorLists(
      competitorLists.map(list => 
        list.id === id 
          ? { ...list, isPinned: !list.isPinned } 
          : list
      )
    );
    closeAllMenus();
  }

  const duplicateList = (id: string) => {
    const listToDuplicate = competitorLists.find(list => list.id === id);
    if (listToDuplicate) {
      const duplicatedList = {
        ...listToDuplicate,
        id: Date.now().toString(),
        name: `${listToDuplicate.name} (copy)`,
      };
      setCompetitorLists([...competitorLists, duplicatedList]);
    }
    closeAllMenus();
  }

  const deleteList = (id: string) => {
    // Don't delete the default list
    if (id === "default") return;
    
    setCompetitorLists(competitorLists.filter(list => list.id !== id));
    closeAllMenus();
  }

  // Sort lists so pinned items appear first
  const sortedLists = [...competitorLists].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400">Loading competitors...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Tracked Competitors</h1>
      </div>
      
      {competitorLists.length === 0 ? (
        // Empty state container
        <div className="flex items-center justify-center py-24">
          <div className="w-full max-w-lg h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't created any competitor lists yet.</p>
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaPlus size={18} />
              <span>Create new competitor list</span>
            </button>
          </div>
        </div>
      ) : (
        // Competitor lists grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create new competitor list button - Always first */}
          <div 
            className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <FaPlus size={18} />
                <span className="font-medium">Create new competitor list</span>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Add a new collection</p>
          </div>
          
          {/* Competitor lists */}
          {sortedLists.map((list) => (
            <div key={list.id} className="relative">
              <Link href={`/dashboard/competitors/${list.id}?name=${encodeURIComponent(list.name)}`}>
                <div className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-5 transition-colors cursor-pointer group shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="text-gray-800 dark:text-white font-medium text-lg">{list.name}</h3>
                    <button 
                      onClick={(e) => toggleMenu(list.id, e)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <FaEllipsisV size={16} />
                    </button>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{list.competitors.length} competitors</p>
                </div>
              </Link>

              {/* Context menu */}
              {openMenuId === list.id && (
                <div 
                  ref={menuRef}
                  className="absolute top-12 right-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      pinList(list.id);
                    }}
                  >
                    <FaThumbtack size={16} className={list.isPinned ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                    {list.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button 
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openModal(list.id);
                    }}
                  >
                    <FaPencilAlt size={16} />
                    Rename
                  </button>
                  <button 
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      duplicateList(list.id);
                    }}
                  >
                    <FaCopy size={16} />
                    Duplicate
                  </button>
                  <button 
                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left ${
                      list.id === "default" ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (list.id !== "default") {
                        deleteList(list.id);
                      }
                    }}
                    disabled={list.id === "default"}
                  >
                    <FaTrash size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeModal} 
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {editingListId !== null ? 'Rename competitor list' : 'Create competitor list'}
            </h3>
            <div className="mb-4">
              <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2">Name</label>
              <input 
                type="text" 
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter list name"
                autoFocus
              />
            </div>
            <div className="flex justify-end">
              <button 
                onClick={closeModal}
                className="bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-4 py-2 rounded-lg mr-2"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                disabled={!listName.trim()}
              >
                {editingListId !== null ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 