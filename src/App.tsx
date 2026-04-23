/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useMediaQuery } from './lib/utils';
import { EditorRef } from './components/ProseMirrorEditor';
import { chatWithAI, checkOllamaConnection, type ChatMessage } from './services/aiService';
import { ragService } from './services/ragService';
import { importFile } from './services/importService';
import { embeddingService, EmbeddingStatus } from './services/embeddingService';
import { useEditorStore } from './stores/editorStore';
import { useUIStore } from './stores/uiStore';
import { useAIStore } from './stores/aiStore';
import { useSettingsStore } from './stores/settingsStore';

// Components
import { MobileMenu } from './components/navigation/MobileMenu';
import { AIAssistantSidebar } from './components/ai/AIAssistantSidebar';
import { SavedConversationsOverlay } from './components/ai/SavedConversationsOverlay';
import { PagesManager } from './components/navigation/PagesManager';

import { AIProviderSettings } from './components/ai/AIProviderSettings';
import { AIReviewPanel } from './components/ai/AIReviewPanel';
import { EditorContainer } from './components/editor/EditorContainer';
import { FloatingToolbar } from './components/navigation/FloatingToolbar';
import { SearchBar } from './components/overlays/SearchBar';
import { FileActionsMenu } from './components/overlays/FileActionsMenu';
import { SettingsModal } from './components/overlays/SettingsModal';
import { ShortcutsHelp } from './components/overlays/ShortcutsHelp';
import { StatusBar } from './components/layout/StatusBar';
import { MobileToolbar } from './components/navigation/MobileToolbar';
import { SemanticFolders } from './components/SemanticFolders';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const {
    pages,
    activePageIds,
    setPageContent,
    addPage,
    togglePageOpen,
    setPageSettings,
    wordGoal,
    setWordGoal,
    addSnapshot,
    loadSnapshots
  } = useEditorStore();

  // Ref for multiple editors
  const editorRefs = useRef<Record<string, EditorRef | null>>({});

  // For compatibility with single-doc logic, we'll use the "last active" page for some things
  const activePage = pages.find(p => p.id === activePageIds[activePageIds.length - 1]) || pages[0];
  const markdown = activePage?.content || '';
  const setMarkdown = (content: string) => {
    if (activePage) setPageContent(activePage.id, content);
  };

  const {
    showAIAssistant: showAiAssistant, setAIAssistant: setAiAssistant,
    showSearch, setSearch,
    showSemanticFolders, setSemanticFolders,
    setMobileMenu,
    showSettings, setSettings,
    showAiSettings, setAiSettings,
    showSavedConversations, setSavedConversations,
    showPages, setPagesMenu,
    direction, setDirection,
  } = useUIStore();

  const {
    chatHistory, setChatHistory,
    personalInstructions: aiPersonalInstructions, setPersonalInstructions: setAiPersonalInstructions,
    setAvailableModels,
    isGenerating: isGeneratingAi, setGenerating: setIsGeneratingAi,
    ollamaStatus, setOllamaStatus,
    savedChats, setSavedChats,
    provider,
    serviceConfigs, setServiceProvider, setServiceModel,
    apiKeys, setApiKey,
    providerConfigs, setOllamaHost
  } = useAIStore();

  const {
    theme,
    fontSize,
    lineHeight,
    maxWidth,
    fontFamily
  } = useSettingsStore();

  const isMobile = useMediaQuery('(max-width: 768px)');

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiSettingsTab, setAiSettingsTab] = useState<'chat' | 'actions' | 'semantic' | 'embeddings'>('chat');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchIndex, setSearchIndex] = useState(-1);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isWholeWord, setIsWholeWord] = useState(false);
  const [isSemantic, setIsSemantic] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showFileActions, setShowFileActions] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const pagesRef = useRef(pages);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  // Auto-save logic: 5 minute interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLastSaved(now);
      localStorage.setItem('ink-quill-autosave-backup-v2', JSON.stringify(pagesRef.current));
      localStorage.setItem('ink-quill-autosave-time', now.toISOString());
    }, 5 * 60 * 1000);

    const savedTime = localStorage.getItem('ink-quill-autosave-time');
    if (savedTime) setLastSaved(new Date(savedTime));

    return () => clearInterval(interval);
  }, []);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [chatAttachedImages, setChatAttachedImages] = useState<string[]>([]);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const [embeddingStatus, setEmbeddingStatus] = useState<EmbeddingStatus>('idle');
  const [embeddingProgress, setEmbeddingProgress] = useState(0);

  useEffect(() => {
    return embeddingService.subscribe((status, progress) => {
      setEmbeddingStatus(status);
      setEmbeddingProgress(progress);
    });
  }, []);

  useEffect(() => {
    import('./services/embeddingService').then(({ vectorStore }) => {
      vectorStore.init().then(() => {
        useUIStore.getState().setIndexedCounts(vectorStore.getChunks().length, vectorStore.getEpisodes().length);
      });
    });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const lastId = activePageIds[activePageIds.length - 1];
        editorRefs.current[lastId]?.insertImage(dataUrl, file.name);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm("Importing this file will replace your current document. Continue?")) {
      try {
        const content = await importFile(file);
        setMarkdown(content);
        alert("File imported successfully!");
      } catch (error) {
        console.error("Import failed:", error);
        alert("Failed to import file: " + (error instanceof Error ? error.message : String(error)));
      }
    }

    if (importFileInputRef.current) importFileInputRef.current.value = '';
  };

  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setChatAttachedImages(prev => [...prev, dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (chatImageInputRef.current) chatImageInputRef.current.value = '';
  };

  const saveCurrentChat = () => {
    if (chatHistory.length === 0) return;
    const name = window.prompt("Enter a name for this conversation:", `Chat ${new Date().toLocaleString()}`);
    if (!name) return;

    const newChat = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      history: chatHistory,
      timestamp: Date.now(),
      documentSnapshot: markdown
    };

    const updated = [newChat, ...savedChats];
    setSavedChats(updated);

    const embeddingOptions = {
      provider: serviceConfigs.embeddings.provider,
      apiKey: apiKeys?.[serviceConfigs.embeddings.provider as keyof typeof apiKeys],
      model: serviceConfigs.embeddings.model
    };
    ragService.indexConversation(newChat.id, newChat.name, newChat.history, embeddingOptions);

    alert("Conversation saved successfully.");
  };

  const loadChat = (chat: any) => {
    setChatHistory(chat.history);
    setSavedConversations(false);
  };

  const deleteSavedChat = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this saved conversation?")) return;
    const updated = savedChats.filter(c => c.id !== id);
    setSavedChats(updated);
  };

  const exportChat = (history: ChatMessage[], format: 'json' | 'md') => {
    let content = "";
    let filename = `chat-export-${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(history, null, 2);
      filename += ".json";
    } else {
      content = history.map(m => `### ${m.role.toUpperCase()}\n\n${m.parts[0].text}`).join('\n\n---\n\n');
      filename += ".md";
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatChatInput = (type: 'bold' | 'italic' | 'list') => {
    if (!chatInputRef.current) return;
    const { selectionStart, selectionEnd } = chatInputRef.current;
    const text = aiPrompt;
    const selected = text.substring(selectionStart, selectionEnd);
    let formatted = "";
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        formatted = `**${selected}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formatted = `*${selected}*`;
        cursorOffset = 1;
        break;
      case 'list':
        formatted = `\n- ${selected}`;
        cursorOffset = 3;
        break;
    }

    const newText = text.substring(0, selectionStart) + formatted + text.substring(selectionEnd);
    setAiPrompt(newText);

    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        const newPos = selectionStart + cursorOffset + (selected ? selected.length : 0);
        chatInputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  useEffect(() => {
    loadSnapshots(activePageIds[0]!);
  }, [loadSnapshots]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Auto-snapshot every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      addSnapshot(activePageIds[0]!, markdown);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [markdown, addSnapshot]);

  // Debounced RAG indexing
  useEffect(() => {
    const timeout = setTimeout(() => {
      const embeddingOptions = {
        provider: serviceConfigs.embeddings.provider,
        apiKey: apiKeys?.[serviceConfigs.embeddings.provider as keyof typeof apiKeys],
        model: serviceConfigs.embeddings.model
      };
      ragService.indexDocument(markdown, embeddingOptions);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [markdown, serviceConfigs.embeddings, apiKeys]);

  // Snapshot on document close
  useEffect(() => {
    const handleBeforeUnload = () => {
      addSnapshot(activePageIds[0]!, markdown);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [markdown, addSnapshot]);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.style.setProperty('--minimal-font', fontFamily);
    root.style.setProperty('--editor-font-size', `${fontSize}px`);
    root.style.setProperty('--editor-line-height', lineHeight.toString());
    root.style.setProperty('--editor-max-width', maxWidth);
  }, [theme, fontFamily, fontSize, lineHeight, maxWidth]);

  const insertText = (before: string, after: string = '') => {
    const activeId = activePageIds[activePageIds.length - 1];
    if (!editorRefs.current[activeId]) return;
    editorRefs.current[activeId]?.insertText(before, after);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') {
        e.preventDefault();
        insertText('[', '](url)');
      } else if (e.key === 'f') {
        e.preventDefault();
        setSearch(!showSearch);
        if (!showSearch) {
          setSearchIndex(-1);
        }
      } else if (e.key === 't' && e.shiftKey) {
        e.preventDefault();
        const activeId = activePageIds[activePageIds.length - 1];
        const page = pages.find(p => p.id === activeId);
        if (page) {
          setPageSettings(activeId, { isTypewriter: !page.isTypewriter });
        }
      } else if (e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    }
  };

  useEffect(() => {
    if (!findText) {
      setMatchCount(0);
      setCurrentMatchIndex(0);
      setSearchIndex(-1);
      return;
    }

    if (isSemantic) return;

    const flags = isCaseSensitive ? 'g' : 'gi';
    let pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const matches = [...markdown.matchAll(regex)];
      setMatchCount(matches.length);

      const idx = matches.findIndex(m => m.index === searchIndex);
      if (idx !== -1) {
        setCurrentMatchIndex(idx + 1);
      } else if (matches.length > 0 && searchIndex === -1) {
        setCurrentMatchIndex(0);
      } else if (matches.length === 0) {
        setCurrentMatchIndex(0);
        setSearchIndex(-1);
      }
    } catch (e) {
      setMatchCount(0);
      setCurrentMatchIndex(0);
    }
  }, [findText, markdown, isCaseSensitive, isWholeWord, isSemantic, searchIndex]);

  const handleFindNext = () => {
    if (!findText || matchCount === 0) return;

    if (isSemantic) {
      const nextIdx = (currentMatchIndex % matchCount) + 1;
      setCurrentMatchIndex(nextIdx);
      return;
    }

    const flags = isCaseSensitive ? 'g' : 'gi';
    let pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) pattern = `\\b${pattern}\\b`;

    const regex = new RegExp(pattern, flags);
    const startPos = searchIndex === -1 ? 0 : searchIndex + 1;
    regex.lastIndex = startPos;

    let result = regex.exec(markdown);
    if (!result) {
      regex.lastIndex = 0;
      result = regex.exec(markdown);
    }

    if (result) {
      setSearchIndex(result.index);
    } else {
      setSearchIndex(-1);
    }
  };

  const handleReplace = () => {
    if (!findText) return;
    const start = searchIndex;
    if (start !== -1) {
      const newMarkdown = markdown.substring(0, start) + replaceText + markdown.substring(start + findText.length);
      setMarkdown(newMarkdown);
      setTimeout(handleFindNext, 0);
    } else {
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!findText || matchCount === 0) return;

    if (window.confirm(`Are you sure you want to replace all ${matchCount} occurrence(s) of "${findText}"?`)) {
      const flags = isCaseSensitive ? 'g' : 'gi';
      let pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (isWholeWord) pattern = `\\b${pattern}\\b`;

      const regex = new RegExp(pattern, flags);
      const newMarkdown = markdown.replace(regex, replaceText);
      setMarkdown(newMarkdown);

      alert(`Successfully replaced ${matchCount} occurrence(s).`);
      setSearchIndex(-1);
    }
  };

  const takeSnapshot = async () => {
    const activeId = activePageIds[activePageIds.length - 1];
    if (activeId) {
      await addSnapshot(activeId, markdown);
      alert("Snapshot saved successfully.");
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() && chatAttachedImages.length === 0) return;

    const embeddingOptions = {
      provider: serviceConfigs.embeddings.provider,
      apiKey: apiKeys?.[serviceConfigs.embeddings.provider as keyof typeof apiKeys],
      model: serviceConfigs.embeddings.model
    };
    ragService.indexDocument(markdown, embeddingOptions);

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: aiPrompt }],
      images: chatAttachedImages.length > 0 ? chatAttachedImages : undefined
    };
    const historyWithUser = [...chatHistory, userMessage];
    setChatHistory(historyWithUser);
    setAiPrompt('');
    setChatAttachedImages([]);
    setIsGeneratingAi(true);
    setAiResult(null);

    setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

    const activeId = activePageIds[activePageIds.length - 1];
    const cursorContext = editorRefs.current[activeId]?.getCursorContext() || "";

    try {
      let fullResponse = "";
      const response = await chatWithAI(
        historyWithUser,
        markdown,
        {
          personalInstructions: aiPersonalInstructions,
          model: serviceConfigs.chat.model,
          provider: serviceConfigs.chat.provider,
          apiKeys,
          providerConfigs,
          onChunk: (chunk) => {
            fullResponse += chunk;
            setChatHistory(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === 'model') {
                next[next.length - 1] = { ...last, parts: [{ text: fullResponse }] };
              }
              return next;
            });
          },
          cursorContext,
          embeddingOptions
        }
      );
      setAiResult(response);
    } catch (error) {
      console.error("AI Generation failed:", error);
      const errorMessage = `Error: ${error instanceof Error ? error.message : String(error)}`;
      setChatHistory(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'model', parts: [{ text: errorMessage }] };
        return next;
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const applyAiResult = (method: 'append' | 'insert' | 'replace' | 'suggest') => {
    if (!aiResult) return;

    const activeId = activePageIds[activePageIds.length - 1];
    const editor = editorRefs.current[activeId];

    switch (method) {
      case 'append':
        const prefix = markdown.trim() ? "\n\n" : "";
        editor?.appendMarkdown(prefix + aiResult);
        break;
      case 'insert':
      case 'replace':
        editor?.replaceSelectionWithMarkdown(aiResult);
        break;
      case 'suggest':
        editor?.replaceSelectionWithMarkdown(`\n\n> **Suggested Edit:**\n> ${aiResult.split('\n').join('\n> ')}\n\n`);
        break;
    }

    setAiResult(null);
    setAiAssistant(false);
  };

  useEffect(() => {
    const anyOllama = Object.values(serviceConfigs).some(c => c.provider === 'ollama');

    if (anyOllama) {
      setOllamaStatus({ ...ollamaStatus, loading: true });
      const activeOllamaModel = Object.values(serviceConfigs).find(c => c.provider === 'ollama')?.model || 'mistral';
      checkOllamaConnection(activeOllamaModel).then(res => {
        setOllamaStatus({
          loading: false,
          connected: res.success,
          model: res.model || '',
          error: res.error
        });
        if (res.allModels) {
          setAvailableModels(res.allModels);
        }
      });
    } else {
      setOllamaStatus({
        loading: false,
        connected: false,
        model: ''
      });
    }
  }, [serviceConfigs]);

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;
  const readingTime = Math.ceil(wordCount / 200);
  const goalProgress = wordGoal > 0 ? Math.min((wordCount / wordGoal) * 100, 100) : 0;

  function clearEditor(): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div
      dir={direction}
      className={cn(
        "min-h-screen bg-minimal-bg text-minimal-text font-sans flex flex-col selection:bg-minimal-accent/20 transition-colors duration-500",
        ""
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
      <input
        type="file"
        ref={importFileInputRef}
        className="hidden"
        accept=".docx,.html,.htm,.md,.markdown,.txt"
        onChange={handleFileImport}
      />

      <MobileMenu clearEditor={clearEditor} />

      <AIAssistantSidebar
        chatScrollRef={chatScrollRef}
        chatInputRef={chatInputRef}
        chatImageInputRef={chatImageInputRef}
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        chatAttachedImages={chatAttachedImages}
        setChatAttachedImages={setChatAttachedImages}
        handleAiGenerate={handleAiGenerate}
        saveCurrentChat={saveCurrentChat}
        handleChatImageUpload={handleChatImageUpload}
        formatChatInput={formatChatInput}
        exportChat={exportChat}
        setAiResult={setAiResult}
      />

      <SavedConversationsOverlay
        loadChat={loadChat}
        setMarkdown={setMarkdown}
        exportChat={exportChat}
        deleteSavedChat={deleteSavedChat}
      />

      <AIProviderSettings
        aiSettingsTab={aiSettingsTab}
        setAiSettingsTab={setAiSettingsTab}
      />

      <AIReviewPanel
        aiResult={aiResult}
        setAiResult={setAiResult}
        applyAiResult={applyAiResult}
      />

      <EditorContainer
        editorRefs={editorRefs}
        handleKeyDown={handleKeyDown}
        insertText={insertText}
        fileInputRef={fileInputRef}
        setAiResult={setAiResult}
        isSemantic={isSemantic}
        setMatchCount={setMatchCount}
        findText={findText}
        isCaseSensitive={isCaseSensitive}
        isWholeWord={isWholeWord}
        searchIndex={searchIndex}
        currentMatchIndex={currentMatchIndex}
      />

      {!isMobile && (
        <FloatingToolbar
          wordGoal={wordGoal}
          setWordGoal={setWordGoal}
          clearEditor={clearEditor}
          direction={direction}
          setDirection={setDirection}
        />
      )}

      <SearchBar
        findText={findText}
        setFindText={setFindText}
        replaceText={replaceText}
        setReplaceText={setReplaceText}
        matchCount={matchCount}
        currentMatchIndex={currentMatchIndex}
        isCaseSensitive={isCaseSensitive}
        setIsCaseSensitive={setIsCaseSensitive}
        isWholeWord={isWholeWord}
        setIsWholeWord={setIsWholeWord}
        isSemantic={isSemantic}
        setIsSemantic={setIsSemantic}
        handleFindNext={handleFindNext}
        handleReplace={handleReplace}
        handleReplaceAll={handleReplaceAll}
        setSearchIndex={setSearchIndex}
      />

      <AnimatePresence>
        {showSemanticFolders && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 z-[100] w-[320px] shadow-2xl"
          >
            <div className="h-full relative">
              <button
                onClick={() => setSemanticFolders(false)}
                className="absolute top-4 -left-12 p-2 bg-minimal-bg border border-minimal-border rounded-full hover:text-red-500 transition-colors shadow-lg z-[110]"
              >
                <X className="w-4 h-4" />
              </button>
              <SemanticFolders onJump={(text) => {
                const lastId = activePageIds[activePageIds.length - 1];
                editorRefs.current[lastId]?.scrollToText(text);
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PagesManager />

      {isMobile && (
        <MobileToolbar
          editorRef={{ current: editorRefs.current[activePageIds[activePageIds.length - 1]] }}
          fileInputRef={fileInputRef}
          insertText={insertText}
        />
      )}

      <SettingsModal />

      <ShortcutsHelp
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
      />

      <FileActionsMenu
        showFileActions={showFileActions}
        setShowFileActions={setShowFileActions}
        importFileInputRef={importFileInputRef}
        editorRef={{ current: editorRefs.current[activePageIds[activePageIds.length - 1]] }}
        markdown={markdown}
      />

      <StatusBar
        wordCount={wordCount}
        charCount={charCount}
        readingTime={readingTime}
        wordGoal={wordGoal}
        goalProgress={goalProgress}
        embeddingStatus={embeddingStatus}
        embeddingProgress={embeddingProgress}
      />
    </div>
  );
}
