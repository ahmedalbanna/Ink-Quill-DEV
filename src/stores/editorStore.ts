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
  wordGoal: number;
  snapshots: Snapshot[];
  cursor?: { from: number; to: number };
  updatedAt: number;
}

interface EditorState {
  pages: Page[];
  activePageIds: string[]; // Pages currently visible/open horizontally
  semanticClusters: SemanticCluster[];
  
  setPageContent: (id: string, content: string) => void;
  setPageSettings: (id: string, settings: Partial<Pick<Page, 'isTypewriter' | 'isFocusMode' | 'wordGoal'>>) => void;
  addPage: (title?: string, content?: string) => void;
  removePage: (id: string) => void;
  togglePageOpen: (id: string) => void;
  setPageCursor: (id: string, cursor: { from: number; to: number } | null) => void;
  setSemanticClusters: (clusters: SemanticCluster[]) => void;
  addSnapshot: (pageId: string, content: string, userNote?: string) => Promise<void>;
  loadSnapshots: (pageId: string) => Promise<void>;
  wipePage: (id: string) => void;
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
          wordGoal: 0,
          snapshots: [],
          updatedAt: Date.now()
        }],
      activePageIds: ['default'],
      semanticClusters: [],
      
      setPageContent: (id, content) => set((state) => ({
        pages: state.pages.map(p => p.id === id ? { ...p, content, updatedAt: Date.now() } : p)
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
          wordGoal: 0,
          snapshots: [],
          updatedAt: Date.now()
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
      setPageCursor: (id, cursor) => set((state) => ({
        pages: state.pages.map(p => p.id === id ? { ...p, cursor: cursor || undefined } : p)
      })),
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
        const snapshots = await snapshotService.getSnapshots();
        set((state) => ({
          pages: state.pages.map(p => p.id === pageId ? { ...p, snapshots } : p)
        }));
      },
      wipePage: (id) => set((state) => ({
        pages: state.pages.map(p => p.id === id ? { ...p, content: '' } : p)
      })),
      clearSnapshots: async (pageId) => {
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
      }),
    }
  )
);

