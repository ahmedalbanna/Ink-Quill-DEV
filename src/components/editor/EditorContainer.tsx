import React, { useState } from 'react';
import { Plus, X, Type, Maximize2 as FocusOn, Target, FileDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import ProseMirrorEditor, { EditorRef } from '../ProseMirrorEditor';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useAIStore } from '../../stores/aiStore';
import { SnapshotsMenu } from '../overlays/SnapshotsMenu';
import { FileActionsMenu } from '../overlays/FileActionsMenu';
import { motion, AnimatePresence } from 'motion/react';

interface EditorContainerProps {
  editorRefs: React.MutableRefObject<Record<string, EditorRef | null>>;
  handleKeyDown: (e: KeyboardEvent) => void;
  insertText: (before: string, after: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  applyContent: (content: string, method: 'append' | 'insert' | 'replace' | 'suggest') => void;
  isSemantic: boolean;
  setMatchCount: (val: number) => void;
  findText: string;
  isCaseSensitive: boolean;
  isWholeWord: boolean;
  searchIndex: number;
  currentMatchIndex: number;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({
  editorRefs,
  handleKeyDown,
  insertText,
  fileInputRef,
  applyContent,
  isSemantic,
  setMatchCount,
  findText,
  isCaseSensitive,
  isWholeWord,
  searchIndex,
  currentMatchIndex
}) => {
  const {
    pages,
    activePageIds,
    setPageContent,
    addPage,
    togglePageOpen,
    setPageSettings,
    setPageCursor,
    addSnapshot
  } = useEditorStore();
  const { direction, showSearch } = useUIStore();
  const { personalInstructions: aiPersonalInstructions, serviceConfigs, apiKeys, providerConfigs } = useAIStore();
  const { setAIAssistant } = useUIStore();

  const [visibleSnapshots, setVisibleSnapshots] = useState<Record<string, boolean>>({});
  const [visibleFileActions, setVisibleFileActions] = useState<Record<string, boolean>>({});
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  const toggleSnapshots = (pageId: string) => {
    setVisibleSnapshots(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  const toggleFileActions = (pageId: string) => {
    setVisibleFileActions(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  return (
    <main className={cn(
      "flex-1 flex relative overflow-hidden bg-minimal-sidebar transition-all duration-1000",
      "pt-0"
    )}>
      <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory flex gap-4 md:gap-8 p-4 md:p-12 custom-scrollbar bg-minimal-sidebar/50 scroll-smooth">
        <AnimatePresence mode="popLayout" initial={false}>
          {activePageIds.map(id => {
            const page = pages.find(p => p.id === id);
            if (!page) return null;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="flex-shrink-0 w-[calc(100vw-4rem)] md:w-full max-w-[850px] h-full bg-minimal-bg shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-xl border border-minimal-border flex flex-col snap-center relative group mx-2 md:mx-4 first:ml-auto last:mr-auto"
              >
                <div className="px-4 md:px-6 py-2 md:py-3 border-b border-minimal-border flex items-center justify-between bg-minimal-sidebar/30 rounded-t-xl transition-all duration-300">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-minimal-accent text-white flex items-center justify-center text-[9px] md:text-[10px] font-bold">
                      {pages.indexOf(page) + 1}
                    </div>
                    <span className="text-[9px] md:text-[10px] font-bold text-minimal-muted uppercase tracking-widest truncate max-w-[100px] md:max-w-none">{page.title}</span>
                  </div>

                  <div className="flex items-center gap-0.5 md:gap-1">
                    {/* Per-page controls */}
                    <div className="flex items-center bg-minimal-bg/50 rounded-lg border border-minimal-border/50 p-0.5 mr-1 md:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 lg:opacity-100">
                      {/* Word Goal Control */}
                      <div className="hidden sm:flex items-center gap-1 px-1.5 border-r border-minimal-border/50 mr-1">
                      {editingGoal === id ? (
                        <input
                          autoFocus
                          type="number"
                          className="w-12 bg-transparent text-[10px] font-mono font-bold text-minimal-accent outline-none"
                          defaultValue={page.wordGoal || 0}
                          onBlur={(e) => {
                            setPageSettings(id, { wordGoal: parseInt(e.target.value) || 0 });
                            setEditingGoal(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingGoal(id)}
                          className={cn(
                            "flex items-center gap-1.5 hover:text-minimal-accent transition-colors",
                            page.wordGoal > 0 ? "text-minimal-accent" : "text-minimal-muted"
                          )}
                          title="Set Word Goal"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-mono font-bold">{page.wordGoal || 'GOAL'}</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setPageSettings(id, { isTypewriter: !page.isTypewriter })}
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        page.isTypewriter ? "bg-minimal-accent text-white" : "text-minimal-muted hover:text-minimal-text hover:bg-minimal-sidebar"
                      )}
                      title="Typewriter Mode"
                    >
                      <Type className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPageSettings(id, { isFocusMode: !page.isFocusMode })}
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        page.isFocusMode ? "bg-minimal-accent text-white" : "text-minimal-muted hover:text-minimal-text hover:bg-minimal-sidebar"
                      )}
                      title="Paragraph Focus Mode"
                    >
                      <FocusOn className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3.5 bg-minimal-border mx-1" />
                    
                    <SnapshotsMenu
                      pageId={id}
                      showSnapshots={!!visibleSnapshots[id]}
                      setShowSnapshots={() => toggleSnapshots(id)}
                      takeSnapshot={() => addSnapshot(id, page.content)}
                      setMarkdown={(content) => setPageContent(id, content)}
                    />

                    <div className="relative">
                      <FileActionsMenu
                        pageId={id}
                        showFileActions={visibleFileActions[id]}
                        setShowFileActions={(v) => setVisibleFileActions(prev => ({ ...prev, [id]: v }))}
                        editorRef={{ current: editorRefs.current[id] }}
                        markdown={page.content}
                        inline={true}
                      />
                      <button
                        onClick={() => toggleFileActions(id)}
                        className={cn(
                          "p-1.5 rounded-md transition-all",
                          visibleFileActions[id] ? "bg-minimal-accent text-white" : "text-minimal-muted hover:text-minimal-text hover:bg-minimal-sidebar"
                        )}
                        title="File Actions"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => togglePageOpen(id)}
                    className="p-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Close page"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <ProseMirrorEditor
                  ref={el => { editorRefs.current[id] = el; }}
                  value={page.content}
                  onChange={(c) => setPageContent(id, c)}
                  onKeyDown={handleKeyDown}
                  isTypewriter={page.isTypewriter}
                  isFocusMode={page.isFocusMode}
                  onToggleFocusMode={() => setPageSettings(id, { isFocusMode: !page.isFocusMode })}
                  initialCursor={page.cursor}
                  onSelectionChange={(sel) => setPageCursor(id, sel)}
                  direction={direction}
                  personalInstructions={aiPersonalInstructions}
                  selectedModel={serviceConfigs.actions.model}
                  provider={serviceConfigs.actions.provider}
                  apiKeys={apiKeys}
                  providerConfigs={providerConfigs}
                  onAiResult={(result) => {
                    // For internal actions, let's just insert directly if it's already done
                    // But usually onAiStream would have handled it.
                    editorRefs.current[id]?.streamMarkdown(result, false);
                  }}
                  onAiStream={(chunk, isNew) => {
                    editorRefs.current[id]?.streamMarkdown(chunk, isNew);
                    // Also open the sidebar to show the user what's happening in context if needed
                    // setAIAssistant(true);
                  }}
                  onSearchMetadata={(count) => {
                    if (isSemantic) {
                      setMatchCount(count);
                    }
                  }}
                  onImageUploadRequest={() => {
                    const choice = window.confirm("Click OK to Upload an image, or Cancel to provide a URL.");
                    if (choice) {
                      fileInputRef.current?.click();
                    } else {
                      const url = window.prompt("Enter Image URL:");
                      if (url) {
                        editorRefs.current[id]?.insertImage(url, "Image Alternative Text");
                      }
                    }
                  }}
                  searchQuery={showSearch ? findText : ''}
                  searchOptions={{
                    isCaseSensitive,
                    isWholeWord,
                    isSemantic,
                    searchIndex,
                    currentMatchIndex,
                    embeddingOptions: {
                      provider: serviceConfigs.embeddings.provider,
                      apiKey: apiKeys?.[serviceConfigs.embeddings.provider as keyof typeof apiKeys],
                      model: serviceConfigs.embeddings.model
                    }
                  }}
                  collab={{
                    enabled: true,
                    docId: `local-document-${id}`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

        <button
          onClick={() => addPage('New Chapter')}
          className="flex-shrink-0 w-64 h-full border-2 border-dashed border-minimal-border rounded-xl flex flex-col items-center justify-center gap-3 text-minimal-muted hover:border-minimal-accent/40 hover:text-minimal-accent hover:bg-minimal-sidebar transition-all group"
        >
          <div className="p-4 bg-minimal-sidebar rounded-full group-hover:rotate-180 transition-transform duration-500">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">New Chapter</span>
        </button>
      </div>
    </main>
  );
};
