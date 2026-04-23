import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface MobileMenuProps {
  clearEditor: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ clearEditor }) => {
  const { showMobileMenu, setMobileMenu, setAIAssistant } = useUIStore();

  return (
    <AnimatePresence>
      {showMobileMenu && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenu(false)}
            className="fixed inset-0 bg-zinc-950/20 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed top-0 start-0 bottom-0 w-[280px] bg-minimal-bg border-e border-minimal-border z-[90] shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-minimal-border flex justify-between items-center bg-minimal-sidebar">
              <span className="text-xs font-bold text-minimal-muted uppercase tracking-widest">Navigation</span>
              <button onClick={() => setMobileMenu(false)} className="p-1 hover:bg-minimal-border rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <button
                onClick={() => { setAIAssistant(true); setMobileMenu(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-minimal-accent text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-bold">AI Assistant</span>
              </button>

              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-minimal-muted uppercase tracking-wider mb-2">Actions</p>
                <button
                  onClick={() => { clearEditor(); setMobileMenu(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-minimal-border text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear Document</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
