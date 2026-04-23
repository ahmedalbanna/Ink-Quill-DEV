import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, FolderOpen, Save, X, History, Check, ArrowRightLeft, Trash2, Bold, Italic, List, ImagePlus, Download, ImageIcon, Send } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { useAIStore } from '../../stores/aiStore';
import { useUIStore } from '../../stores/uiStore';
import { ChatMessage } from '../../services/aiService';

interface AIAssistantSidebarProps {
  chatScrollRef: React.RefObject<HTMLDivElement>;
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
  chatImageInputRef: React.RefObject<HTMLInputElement>;
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  chatAttachedImages: string[];
  setChatAttachedImages: React.Dispatch<React.SetStateAction<string[]>>;
  handleAiGenerate: () => Promise<void>;
  saveCurrentChat: () => void;
  handleChatImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatChatInput: (type: 'bold' | 'italic' | 'list') => void;
  exportChat: (history: ChatMessage[], format: 'json' | 'md') => void;
  setAiResult: (val: string | null) => void;
}

export const AIAssistantSidebar: React.FC<AIAssistantSidebarProps> = ({
  chatScrollRef,
  chatInputRef,
  chatImageInputRef,
  aiPrompt,
  setAiPrompt,
  chatAttachedImages,
  setChatAttachedImages,
  handleAiGenerate,
  saveCurrentChat,
  handleChatImageUpload,
  formatChatInput,
  exportChat,
  setAiResult
}) => {
  const { showAIAssistant, setAIAssistant, setSavedConversations } = useUIStore();
  const { chatHistory, setChatHistory, isGenerating: isGeneratingAi, ollamaStatus } = useAIStore();

  return (
    <AnimatePresence>
      {showAIAssistant && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAIAssistant(false)}
            className="fixed inset-0 bg-zinc-950/20 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed top-0 end-0 bottom-0 w-full md:w-[400px] bg-minimal-bg border-s border-minimal-border z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-4 md:p-6 border-b border-minimal-border flex justify-between items-center bg-minimal-sidebar">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-minimal-accent flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-minimal-text uppercase tracking-widest leading-none">AI Assistant</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      ollamaStatus.loading ? "bg-minimal-muted animate-pulse" :
                        ollamaStatus.connected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"
                    )} />
                    <p className="text-[9px] text-minimal-muted font-bold uppercase tracking-tight">
                      {ollamaStatus.loading ? "Verifying..." : ollamaStatus.connected ? `Live: ${ollamaStatus.model}` : "Server Offline"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSavedConversations(true)}
                  className="p-2 hover:bg-minimal-border rounded-full text-minimal-muted transition-colors"
                  title="Saved Conversations"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={saveCurrentChat}
                  disabled={chatHistory.length === 0}
                  className="p-2 hover:bg-minimal-border rounded-full text-minimal-muted disabled:opacity-30 transition-colors"
                  title="Save Conversation"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAIAssistant(false)}
                  className="p-2 hover:bg-minimal-border rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-minimal-muted" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8" ref={chatScrollRef}>
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-12">
                    <div className="w-12 h-12 rounded-2xl bg-minimal-border flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-minimal-text" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Deep Intelligence</h3>
                      <p className="text-[10px] font-medium max-w-[200px] mx-auto">Ask Gemini to write, rewrite, or brainstorm with you.</p>
                    </div>
                  </div>
                )}

                {chatHistory.length > 0 && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between sticky top-0 bg-minimal-bg/80 backdrop-blur pb-2 z-10 border-b border-minimal-border/30 mb-4 px-1">
                      <h3 className="text-[10px] font-bold text-minimal-muted uppercase tracking-widest">Deep context Thread</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSavedConversations(true)}
                          className="text-[10px] font-bold text-minimal-muted hover:text-minimal-accent hover:bg-minimal-accent/10 px-2 py-1 rounded transition-all uppercase flex items-center gap-1.5"
                          title="Load Saved Conversations"
                        >
                          <History className="w-3 h-3" /> Library
                        </button>
                        <button
                          onClick={saveCurrentChat}
                          className="text-[10px] font-bold text-minimal-accent hover:bg-minimal-accent/10 px-2 py-1 rounded transition-colors uppercase flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Clear this conversation history?")) {
                              setChatHistory([]);
                              setAiResult(null);
                            }
                          }}
                          className="text-[10px] font-bold text-red-500 hover:bg-red-500/10 px-2 py-1 rounded transition-colors uppercase"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="space-y-6 pb-4">
                      {chatHistory.map((msg, idx) => (
                        <div key={idx} className={cn(
                          "flex flex-col gap-2 max-w-[90%] group/msg",
                          msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                        )}>
                          <div className={cn(
                            "px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed relative",
                            msg.role === 'user'
                              ? "bg-minimal-accent text-white rounded-tr-none shadow-md shadow-minimal-accent/20"
                              : "bg-minimal-sidebar border border-minimal-border text-minimal-text rounded-tl-none"
                          )}>
                            {msg.images && msg.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {msg.images.map((img, i) => (
                                  <img
                                    key={i}
                                    src={img}
                                    alt="uploaded"
                                    className="max-w-full md:max-w-[200px] max-h-[200px] rounded-lg border border-white/20 shadow-sm object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ))}
                              </div>
                            )}
                            <div className="markdown-body">
                              <Markdown>{msg.parts[0].text}</Markdown>
                            </div>

                            {msg.role === 'model' && (
                              <div className="absolute top-0 right-0 -mr-2 -mt-2 flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setAiResult(msg.parts[0].text);
                                    setAIAssistant(true); // Open the insertion helper
                                  }}
                                  className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                                  title="Accept / Use this text"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setAiPrompt(`Revise this section: "${msg.parts[0].text.substring(0, 100)}..." \n\nMy Feedback: `);
                                    chatInputRef.current?.focus();
                                  }}
                                  className="p-1.5 bg-blue-500 text-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                                  title="Revise / Feedback"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setChatHistory(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                                  title="Dismiss"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="text-[8px] font-bold text-minimal-muted uppercase tracking-widest opacity-60 px-1">
                            {msg.role === 'user' ? 'Direct Input' : 'Ink & Quill Intelligence'}
                          </span>
                        </div>
                      ))}
                      {isGeneratingAi && (
                        <div className="flex flex-col gap-2 items-start mr-auto max-w-[90%]">
                          <div className="px-5 py-3 bg-minimal-sidebar border border-minimal-border rounded-2xl rounded-tl-none flex items-center gap-1.5">
                            {[0, 1, 2].map(i => (
                              <motion.div
                                key={i}
                                animate={{ y: [0, -3, 0], opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                className="w-1.5 h-1.5 bg-minimal-accent rounded-full"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              <div className="p-4 md:p-6 bg-minimal-sidebar border-t border-minimal-border">
                <section>
                  {chatAttachedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 px-1">
                      {chatAttachedImages.map((img, idx) => (
                        <div key={idx} className="relative group/img">
                          <img
                            src={img}
                            alt="attached"
                            className="w-12 h-12 rounded-lg object-cover border border-minimal-border shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => setChatAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1 mb-2 px-1">
                    <button onClick={() => formatChatInput('bold')} className="p-1.5 hover:bg-minimal-border rounded text-minimal-muted transition-colors" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                    <button onClick={() => formatChatInput('italic')} className="p-1.5 hover:bg-minimal-border rounded text-minimal-muted transition-colors" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                    <button onClick={() => formatChatInput('list')} className="p-1.5 hover:bg-minimal-border rounded text-minimal-muted transition-colors" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                    <div className="w-px h-3 bg-minimal-border mx-1" />
                    <button onClick={() => chatImageInputRef.current?.click()} className="p-1.5 hover:bg-minimal-border rounded text-minimal-muted transition-colors" title="Attach Image"><ImagePlus className="w-3.5 h-3.5" /></button>
                    <input
                      type="file"
                      ref={chatImageInputRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleChatImageUpload}
                    />
                    {chatHistory.length > 0 && (
                      <div className="ml-auto flex items-center gap-1">
                        <button onClick={() => exportChat(chatHistory, 'json')} className="p-1.5 hover:bg-minimal-border rounded text-minimal-muted transition-colors" title="Export as JSON"><Download className="w-3.5 h-3.5" /></button>
                        <button onClick={() => exportChat(chatHistory, 'md')} className="p-1.5 hover:bg-minimal-border rounded text-minimal-muted transition-colors" title="Export as Markdown"><ImageIcon className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>

                  <div className="relative group">
                    <textarea
                      ref={chatInputRef}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleAiGenerate();
                        }
                      }}
                      placeholder={chatHistory.length > 0 ? "Ask a follow up..." : "How can I help you write today?"}
                      className="w-full h-28 bg-minimal-bg border border-minimal-border rounded-2xl p-4 text-xs focus:ring-4 focus:ring-minimal-accent/5 focus:border-minimal-accent outline-none transition-all resize-none font-medium leading-relaxed pr-12 group-hover:border-minimal-accent/50"
                    />
                    <button
                      onClick={handleAiGenerate}
                      disabled={isGeneratingAi || !aiPrompt.trim()}
                      className="absolute bottom-3 right-3 p-3 bg-minimal-accent text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <div className="absolute top-2 right-3">
                      <span className="text-[9px] font-bold text-minimal-muted/40 uppercase tracking-tighter">CMD+Enter</span>
                    </div>
                  </div>

                  {chatHistory.length === 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={() => setAiPrompt("Brainstorm 5 topics for ")} className="p-2 border border-minimal-border rounded-xl text-[10px] font-bold uppercase tracking-wider text-minimal-muted hover:bg-minimal-bg hover:text-minimal-accent transition-all">Quick Brainstorm</button>
                      <button onClick={() => setAiPrompt("Draft a professional ")} className="p-2 border border-minimal-border rounded-xl text-[10px] font-bold uppercase tracking-wider text-minimal-muted hover:bg-minimal-bg hover:text-minimal-accent transition-all">Quick Draft</button>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
