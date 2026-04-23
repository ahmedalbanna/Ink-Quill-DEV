import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { snapshotService, type Snapshot } from '../services/snapshotService';
import type { SemanticCluster } from '../services/semanticService';

interface Page {
  id: string;
  title: string;
  content: string;
  isTypewriter: boolean;
  isFocusMode: boolean;
  snapshots: Snapshot[];
}

interface EditorState {
  pages: Page[];
  activePageIds: string[]; // Pages currently visible/open horizontally
  cursor: { from: number; to: number } | null;
  semanticClusters: SemanticCluster[];
  wordGoal: number;
  
  setPageContent: (id: string, content: string) => void;
  setPageSettings: (id: string, settings: Partial<Pick<Page, 'isTypewriter' | 'isFocusMode'>>) => void;
  addPage: (title?: string, content?: string) => void;
  removePage: (id: string) => void;
  togglePageOpen: (id: string) => void;
  setCursor: (cursor: { from: number; to: number } | null) => void;
  setSemanticClusters: (clusters: SemanticCluster[]) => void;
  addSnapshot: (pageId: string, content: string, userNote?: string) => Promise<void>;
  loadSnapshots: (pageId: string) => Promise<void>;
  setWordGoal: (goal: number | ((prev: number) => number)) => void;
  clearSnapshots: (pageId: string) => Promise<void>;
  setSnapshots: (pageId: string, snapshots: Snapshot[] | ((prev: Snapshot[]) => Snapshot[])) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      pages: [{ 
        id: 'default', 
        title: 'Chapter 1', 
        content: '# Welcome to Ink & Quill\n\nStart writing...',
        isTypewriter: false,
        isFocusMode: false,
        snapshots: []
      }],
      activePageIds: ['default'],
      cursor: null,
      semanticClusters: [],
      wordGoal: 0,
      
      setPageContent: (id, content) => set((state) => ({
        pages: state.pages.map(p => p.id === id ? { ...p, content } : p)
      })),
      setPageSettings: (id, settings) => set((state) => ({
        pages: state.pages.map(p => p.id === id ? { ...p, ...settings } : p)
      })),
      addPage: (title = 'New Page', content = '') => set((state) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newPage: Page = { 
          id, 
          title, 
          content,
          isTypewriter: false,
          isFocusMode: false,
          snapshots: []
        };
        return {
          pages: [...state.pages, newPage],
          activePageIds: [...state.activePageIds, id]
        };
      }),
      removePage: (id) => set((state) => ({
        pages: state.pages.filter(p => p.id !== id),
        activePageIds: state.activePageIds.filter(pid => pid !== id)
      })),
      togglePageOpen: (id) => set((state) => ({
        activePageIds: state.activePageIds.includes(id) 
          ? state.activePageIds.filter(pid => pid !== id)
          : [...state.activePageIds, id]
      })),
      setCursor: (cursor) => set({ cursor }),
      setSemanticClusters: (semanticClusters) => set({ semanticClusters }),
      addSnapshot: async (pageId, content, userNote) => {
        const snapshot = await snapshotService.saveSnapshot(content, userNote);
        set((state) => ({
          pages: state.pages.map(p => p.id === pageId 
            ? { ...p, snapshots: [snapshot, ...p.snapshots].slice(0, 50) } 
            : p)
        }));
      },
      loadSnapshots: async (pageId) => {
        // Note: Currently snapshots are global in the service, but we'll show them per page in the state
        // In a real app we might want to filter by pageId in the DB
        const snapshots = await snapshotService.getSnapshots();
        set((state) => ({
          pages: state.pages.map(p => p.id === pageId ? { ...p, snapshots } : p)
        }));
      },
      setWordGoal: (wordGoal) => set((state) => ({ 
        wordGoal: typeof wordGoal === 'function' ? wordGoal(state.wordGoal) : wordGoal 
      })),
      clearSnapshots: async (pageId) => {
        // This clears ALL in the service for now, but we'll reflect it in the page state
        await snapshotService.clearAllSnapshots();
        set((state) => ({
          pages: state.pages.map(p => p.id === pageId ? { ...p, snapshots: [] } : p)
        }));
      },
      setSnapshots: (pageId, snapshots) => set((state) => ({
        pages: state.pages.map(p => p.id === pageId 
          ? { ...p, snapshots: typeof snapshots === 'function' ? snapshots(p.snapshots) : snapshots } 
          : p)
      })),
    }),
    {
      name: 'ink-quill-editor-storage-v2',
      partialize: (state) => ({
        pages: state.pages,
        activePageIds: state.activePageIds,
        wordGoal: state.wordGoal,
      }),
    }
  )
);
