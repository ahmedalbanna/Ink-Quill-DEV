import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, X, Zap, ArrowRightLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/uiStore';

interface SearchBarProps {
  findText: string;
  setFindText: (val: string) => void;
  replaceText: string;
  setReplaceText: (val: string) => void;
  matchCount: number;
  currentMatchIndex: number;
  isCaseSensitive: boolean;
  setIsCaseSensitive: (val: boolean) => void;
  isWholeWord: boolean;
  setIsWholeWord: (val: boolean) => void;
  isSemantic: boolean;
  setIsSemantic: (val: boolean) => void;
  semanticResults?: { text: string, score: number, source?: string }[];
  handleFindNext: () => void;
  handleReplace: () => void;
  handleReplaceAll: () => void;
  setSearchIndex: (val: number) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  findText,
  setFindText,
  replaceText,
  setReplaceText,
  matchCount,
  currentMatchIndex,
  isCaseSensitive,
  setIsCaseSensitive,
  isWholeWord,
  setIsWholeWord,
  isSemantic,
  setIsSemantic,
  semanticResults = [],
  handleFindNext,
  handleReplace,
  handleReplaceAll,
  setSearchIndex
}) => {
  const { showSearch, setSearch } = useUIStore();

  return (
    <AnimatePresence>
      {showSearch && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] bg-minimal-bg border border-minimal-border rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-[420px] max-w-[95vw]"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-minimal-sidebar rounded-lg flex items-center px-3 border border-minimal-border focus-within:border-minimal-accent transition-colors">
              <Search className="w-3.5 h-3.5 text-minimal-muted mr-2" />
              <input
                type="text"
                placeholder="Find"
                value={findText}
                onChange={(e) => {
                  setFindText(e.target.value);
                  setSearchIndex(-1);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleFindNext()}
                className="bg-transparent border-none outline-none text-[13px] py-1.5 w-full font-medium"
                autoFocus
              />
              {findText && (
                <div className="text-[10px] font-bold text-minimal-accent px-1.5 py-0.5 bg-minimal-accent/10 rounded mr-1">
                  {matchCount > 0 ? `${currentMatchIndex || '-'} / ${matchCount}` : '0 / 0'}
                </div>
              )}
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => {
                    setIsCaseSensitive(!isCaseSensitive);
                    setSearchIndex(-1);
                  }}
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors",
                    isCaseSensitive ? "bg-minimal-accent text-white" : "text-minimal-muted hover:bg-minimal-border"
                  )}
                  title="Match Case"
                >
                  Aa
                </button>
                <button
                  onClick={() => {
                    setIsWholeWord(!isWholeWord);
                    setSearchIndex(-1);
                  }}
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors border",
                    isWholeWord ? "bg-minimal-accent text-white border-minimal-accent" : "text-minimal-muted hover:bg-minimal-border border-minimal-border"
                  )}
                  title="Match Whole Word"
                >
                  W
                </button>
                <button
                  onClick={() => {
                    setIsSemantic(!isSemantic);
                    setSearchIndex(-1);
                  }}
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded transition-all flex items-center gap-1",
                    isSemantic ? "bg-minimal-accent text-white" : "text-minimal-muted hover:bg-minimal-border border border-minimal-border"
                  )}
                  title="Semantic Search (RAG)"
                >
                  <Zap className={cn("w-2.5 h-2.5", isSemantic ? "fill-current" : "")} />
                  Brain
                </button>
              </div>
            </div>
            {isSemantic && findText && (
              <div className="flex flex-col gap-1 px-1 min-w-[80px]">
                <div className="flex justify-between items-center text-[9px] font-bold text-minimal-muted uppercase tracking-wider">
                  <span>Relevance</span>
                  <span>{semanticResults.filter(r => r.source === 'external').length} Ref</span>
                </div>
                <div className="h-1 bg-minimal-sidebar rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-minimal-accent transition-all duration-500" 
                     style={{ width: matchCount > 0 || semanticResults.length > 0 ? '100%' : '0%' }}
                   />
                </div>
              </div>
            )}
            <div className="flex gap-1">
              <button onClick={handleFindNext} className="p-1.5 hover:bg-minimal-border rounded text-minimal-muted" title="Find Next">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button onClick={() => setSearch(false)} className="p-1.5 hover:bg-minimal-border rounded text-minimal-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isSemantic && semanticResults.some(r => r.source === 'external') && (
            <div className="mt-1 flex flex-col gap-1 border-t border-minimal-border pt-2 max-h-32 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-minimal-muted uppercase tracking-wider mb-1">
                <Zap className="w-2.5 h-2.5 fill-minimal-muted" />
                Knowledge Base (Semantically Similar)
              </div>
              {semanticResults.filter(r => r.source === 'external').map((result, idx) => (
                <div key={idx} className="bg-minimal-sidebar/50 rounded p-1.5 border border-minimal-border/50 hover:border-minimal-accent/30 transition-colors group">
                   <p className="text-[11px] leading-relaxed line-clamp-2 text-minimal-muted group-hover:text-minimal-text transition-colors">
                     {result.text}
                   </p>
                   <div className="flex justify-between items-center mt-1">
                     <span className="text-[9px] font-mono text-minimal-accent">{(result.score * 100).toFixed(0)}% Match</span>
                     <span className="text-[9px] text-minimal-muted opacity-0 group-hover:opacity-100 transition-opacity">Saved Resource</span>
                   </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-minimal-sidebar rounded-lg flex items-center px-3 border border-minimal-border focus-within:border-minimal-accent transition-colors">
              <ArrowRightLeft className="w-3.5 h-3.5 text-minimal-muted me-2" />
              <input
                type="text"
                placeholder="Replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="bg-transparent border-none outline-none text-[13px] py-1.5 w-full font-medium"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleReplace}
                className="px-2 py-1 bg-minimal-border hover:bg-minimal-muted/20 rounded text-[10px] font-bold text-minimal-text uppercase transition-colors"
              >
                Replace
              </button>
              <button
                onClick={handleReplaceAll}
                className="px-2 py-1 bg-minimal-accent/10 hover:bg-minimal-accent/20 rounded text-[10px] font-bold text-minimal-accent uppercase transition-colors"
              >
                All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
