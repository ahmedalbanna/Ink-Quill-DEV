import React, { useState } from 'react';
import { Plus, X, Type, Maximize2 as FocusOn, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import ProseMirrorEditor, { EditorRef } from '../ProseMirrorEditor';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useAIStore } from '../../stores/aiStore';
import { SnapshotsMenu } from '../overlays/SnapshotsMenu';

interface EditorContainerProps {
  editorRefs: React.MutableRefObject<Record<string, EditorRef | null>>;
  handleKeyDown: (e: KeyboardEvent) => void;
  insertText: (before: string, after: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  setAiResult: (val: string | null) => void;
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
  setAiResult,
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
    addSnapshot
  } = useEditorStore();
  const { direction, showSearch } = useUIStore();
  const { personalInstructions: aiPersonalInstructions, serviceConfigs, apiKeys, providerConfigs } = useAIStore();
  const { setAIAssistant } = useUIStore();

  const [visibleSnapshots, setVisibleSnapshots] = useState<Record<string, boolean>>({});

  const toggleSnapshots = (pageId: string) => {
    setVisibleSnapshots(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  return (
    <main className={cn(
      "flex-1 flex relative overflow-hidden bg-minimal-sidebar transition-all duration-1000",
      "pt-0"
    )}>
      <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory flex gap-8 p-8 md:p-12 custom-scrollbar bg-minimal-sidebar/50">
        {activePageIds.map(id => {
          const page = pages.find(p => p.id === id);
          if (!page) return null;
          return (
            <div 
              key={id}
              className="flex-shrink-0 w-full max-w-[850px] h-full bg-minimal-bg shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-xl border border-minimal-border flex flex-col snap-center relative group mx-4 first:ml-auto last:mr-auto"
            >
              <div className="px-6 py-3 border-b border-minimal-border flex items-center justify-between bg-minimal-sidebar/30 rounded-t-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-minimal-accent text-white flex items-center justify-center text-[10px] font-bold">
                    {pages.indexOf(page) + 1}
                  </div>
                  <span className="text-[10px] font-bold text-minimal-muted uppercase tracking-widest">{page.title}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Per-page controls */}
                  <div className="flex items-center bg-minimal-bg/50 rounded-lg border border-minimal-border/50 p-0.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                  direction={direction}
                  personalInstructions={aiPersonalInstructions}
                  selectedModel={serviceConfigs.actions.model}
                  provider={serviceConfigs.actions.provider}
                  apiKeys={apiKeys}
                  providerConfigs={providerConfigs}
                  onAiResult={(result) => {
                    setAiResult(result);
                    setAIAssistant(true);
                  }}
                  onAiStream={(chunk) => {
                    setAiResult(prev => (prev || '') + chunk);
                    setAIAssistant(true);
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
            </div>
          );
        })}
        
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
