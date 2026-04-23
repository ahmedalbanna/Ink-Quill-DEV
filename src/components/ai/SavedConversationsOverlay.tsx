import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderOpen, X, FileText, Download, Trash2 } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import { useUIStore } from '../../stores/uiStore';
import { ChatMessage } from '../../services/aiService';

interface SavedConversationsOverlayProps {
  loadChat: (chat: any) => void;
  setMarkdown: (content: string) => void;
  exportChat: (history: ChatMessage[], format: 'json' | 'md') => void;
  deleteSavedChat: (id: string) => void;
}

export const SavedConversationsOverlay: React.FC<SavedConversationsOverlayProps> = ({
  loadChat,
  setMarkdown,
  exportChat,
  deleteSavedChat
}) => {
  const { showSavedConversations, setSavedConversations } = useUIStore();
  const { savedChats } = useAIStore();

  return (
    <AnimatePresence>
      {showSavedConversations && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSavedConversations(false)}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-[110]"
          />
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed inset-x-4 top-20 bottom-20 md:inset-x-auto md:right-8 md:top-24 md:bottom-24 md:w-[350px] bg-minimal-bg border border-minimal-border rounded-3xl z-[120] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-minimal-border flex justify-between items-center bg-minimal-sidebar px-6">
              <div>
                <h3 className="text-xs font-bold text-minimal-text uppercase tracking-widest">Saved Chats</h3>
                <p className="text-[9px] font-bold text-minimal-muted uppercase tracking-tighter mt-0.5">{savedChats.length} Conversations</p>
              </div>
              <button onClick={() => setSavedConversations(false)} className="p-2 hover:bg-minimal-border rounded-full transition-colors">
                <X className="w-4 h-4 text-minimal-muted" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {savedChats.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-12">
                  <FolderOpen className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No saved chats</p>
                </div>
              ) : (
                savedChats.map(chat => (
                  <div
                    key={chat.id}
                    className="group/item bg-minimal-sidebar hover:bg-minimal-bg border border-minimal-border hover:border-minimal-accent/30 rounded-2xl p-4 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2" onClick={() => loadChat(chat)}>
                      <h4 className="text-[11px] font-bold text-minimal-text line-clamp-1">{chat.name}</h4>
                      <span className="text-[8px] font-bold text-minimal-muted whitespace-nowrap ml-2">
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-minimal-muted line-clamp-2 mb-3" onClick={() => loadChat(chat)}>
                      {chat.history[chat.history.length - 1]?.parts[0].text.substring(0, 80)}...
                    </p>
                    <div className="flex items-center gap-2 pt-3 border-t border-minimal-border/50">
                      {chat.documentSnapshot !== undefined && (
                        <button
                          onClick={() => {
                            if (window.confirm("This will overwrite your current document. Are you sure?")) {
                              setMarkdown(chat.documentSnapshot!);
                              setSavedConversations(false);
                            }
                          }}
                          className="text-[9px] font-bold text-minimal-accent hover:underline uppercase tracking-tight flex items-center gap-1"
                        >
                          <FileText className="w-2.5 h-2.5" /> Restore Doc
                        </button>
                      )}
                      <button
                        onClick={() => exportChat(chat.history, 'md')}
                        className="ml-auto text-[9px] font-bold text-minimal-accent hover:underline uppercase tracking-tight flex items-center gap-1"
                      >
                        <Download className="w-2.5 h-2.5" /> Export
                      </button>
                      <button
                        onClick={() => deleteSavedChat(chat.id)}
                        className="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase tracking-tight flex items-center gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
