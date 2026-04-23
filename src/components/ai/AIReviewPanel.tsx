import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Plus, ChevronDown, ArrowRightLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import { useUIStore } from '../../stores/uiStore';

interface AIReviewPanelProps {
  aiResult: string | null;
  setAiResult: (val: string | null) => void;
  applyAiResult: (method: 'append' | 'insert' | 'replace' | 'suggest') => void;
}

export const AIReviewPanel: React.FC<AIReviewPanelProps> = ({
  aiResult,
  setAiResult,
  applyAiResult
}) => {
  return (
    <AnimatePresence>
      {aiResult && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          className="fixed bottom-12 md:bottom-16 left-1/2 z-[100] w-[95%] max-w-[600px] bg-minimal-bg border border-minimal-border rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col max-h-[70vh]"
        >
          <div className="px-6 py-4 border-b border-minimal-border flex items-center justify-between bg-minimal-sidebar/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-minimal-accent/10 flex items-center justify-center text-minimal-accent">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-[11px] font-bold text-minimal-text uppercase tracking-widest">Intelligent Draft Review</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiResult(null)}
                className="px-3 py-1.5 text-[10px] font-bold text-minimal-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-all uppercase"
              >
                Discard
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-minimal-bg custom-scrollbar">
            <div className="prose prose-sm max-w-none font-medium text-minimal-text leading-relaxed prose-headings:text-minimal-accent prose-headings:font-bold prose-p:mb-4">
              <Markdown>{aiResult}</Markdown>
            </div>
          </div>

          <div className="p-4 bg-minimal-sidebar border-t border-minimal-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => applyAiResult('replace')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-minimal-accent text-white rounded-2xl text-[10px] font-bold shadow-lg shadow-minimal-accent/20 hover:scale-[1.02] active:scale-95 transition-all group"
              >
                <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>REPLACE</span>
              </button>
              <button
                onClick={() => applyAiResult('insert')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-minimal-bg border border-minimal-border text-minimal-text rounded-2xl text-[10px] font-bold hover:bg-minimal-sidebar hover:border-minimal-accent/30 transition-all group"
              >
                <Plus className="w-4 h-4 text-minimal-accent group-hover:rotate-90 transition-transform" />
                <span>INSERT</span>
              </button>
              <button
                onClick={() => applyAiResult('append')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-minimal-bg border border-minimal-border text-minimal-text rounded-2xl text-[10px] font-bold hover:bg-minimal-sidebar hover:border-minimal-accent/30 transition-all group"
              >
                <ChevronDown className="w-4 h-4 text-minimal-accent group-hover:translate-y-0.5 transition-transform" />
                <span>APPEND</span>
              </button>
              <button
                onClick={() => applyAiResult('suggest')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-minimal-bg border border-minimal-border text-minimal-text rounded-2xl text-[10px] font-bold hover:bg-minimal-sidebar hover:border-minimal-accent/30 transition-all group"
              >
                <ArrowRightLeft className="w-4 h-4 text-minimal-accent group-hover:rotate-180 transition-transform duration-500" />
                <span>SUGGEST</span>
              </button>
            </div>
            <p className="text-[9px] text-center text-minimal-muted/60 mt-3 font-medium uppercase tracking-tight">Select desired integration method above to update your document</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
