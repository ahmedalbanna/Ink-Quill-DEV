import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { snapshotService, type Snapshot } from '../services/snapshotService';
import type { SemanticCluster } from '../services/semanticService';

interface Page {
  id: string;
  title: string;
  content: string;
}

interface EditorState {
  pages: Page[];
  activePageIds: string[]; // Pages currently visible/open horizontally
  cursor: { from: number; to: number } | null;
  snapshots: Snapshot[];
  semanticClusters: SemanticCluster[];
  wordGoal: number;
  
  setPageContent: (id: string, content: string) => void;
  addPage: (title?: string, content?: string) => void;
  removePage: (id: string) => void;
  togglePageOpen: (id: string) => void;
  setCursor: (cursor: { from: number; to: number } | null) => void;
  setSemanticClusters: (clusters: SemanticCluster[]) => void;
  addSnapshot: (content: string, userNote?: string) => Promise<void>;
  loadSnapshots: () => Promise<void>;
  setWordGoal: (goal: number | ((prev: number) => number)) => void;
  clearSnapshots: () => Promise<void>;
  setSnapshots: (snapshots: Snapshot[] | ((prev: Snapshot[]) => Snapshot[])) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      pages: [{ id: 'default', title: 'Chapter 1', content: '# Welcome to Ink & Quill\n\nStart writing...' }],
      activePageIds: ['default'],
      cursor: null,
      snapshots: [],
      semanticClusters: [],
      wordGoal: 0,
      
      setPageContent: (id, content) => set((state) => ({
        pages: state.pages.map(p => p.id === id ? { ...p, content } : p)
      })),
      addPage: (title = 'New Page', content = '') => set((state) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newPage = { id, title, content };
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
      addSnapshot: async (content, userNote) => {
        const snapshot = await snapshotService.saveSnapshot(content, userNote);
        set((state) => ({
          snapshots: [snapshot, ...state.snapshots].slice(0, 50),
        }));
      },
      loadSnapshots: async () => {
        const snapshots = await snapshotService.getSnapshots();
        set({ snapshots });
      },
      setWordGoal: (wordGoal) => set((state) => ({ 
        wordGoal: typeof wordGoal === 'function' ? wordGoal(state.wordGoal) : wordGoal 
      })),
      clearSnapshots: async () => {
        await snapshotService.clearAllSnapshots();
        set({ snapshots: [] });
      },
      setSnapshots: (snapshots) => set((state) => ({
        snapshots: typeof snapshots === 'function' ? snapshots(state.snapshots) : snapshots
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
