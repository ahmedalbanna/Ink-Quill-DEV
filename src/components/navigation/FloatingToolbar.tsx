import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, FileText, Cpu, Search, FolderRoot, Type, Target, Settings, Trash2, Languages, Maximize2 as FocusOn } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/uiStore';

interface FloatingToolbarProps {
  wordGoal: number;
  setWordGoal: (goal: number) => void;
  clearEditor: () => void;
  direction: 'ltr' | 'rtl';
  setDirection: (dir: 'ltr' | 'rtl' | ((prev: 'ltr' | 'rtl') => 'ltr' | 'rtl')) => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  wordGoal,
  setWordGoal,
  clearEditor,
  direction,
  setDirection
}) => {
  const {
    showAIAssistant, setAIAssistant,
    showPages, setPagesMenu,
    showAiSettings, setAiSettings,
    showSearch, setSearch,
    showSemanticFolders, setSemanticFolders,
    showSettings, setSettings
  } = useUIStore();

  return (
    <div className="fixed top-8 right-8 z-50 flex flex-col gap-3">
      {/* Assistant Toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => setAIAssistant(!showAIAssistant)}
        className={cn(
          "p-3.5 backdrop-blur border rounded-full shadow-2xl transition-all duration-300",
          showAIAssistant ? "bg-minimal-accent border-minimal-accent text-white" : "bg-minimal-bg/90 border-minimal-border text-minimal-muted"
        )}
        title="AI Assistant"
      >
        <Sparkles className="w-5 h-5" />
      </motion.button>

      {/* Pages Toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => setPagesMenu(!showPages)}
        className={cn(
          "p-3.5 backdrop-blur border rounded-full shadow-2xl transition-all duration-300",
          showPages ? "bg-minimal-accent border-minimal-accent text-white" : "bg-minimal-bg/90 border-minimal-border text-minimal-muted"
        )}
        title="Pages Manager"
      >
        <FileText className="w-5 h-5" />
      </motion.button>

      {/* AI Provider Settings Toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => setAiSettings(!showAiSettings)}
        className={cn(
          "p-3.5 backdrop-blur border rounded-full shadow-2xl transition-all duration-300",
          showAiSettings ? "bg-minimal-accent border-minimal-accent text-white" : "bg-minimal-bg/90 border-minimal-border text-minimal-muted"
        )}
        title="AI Provider Settings"
      >
        <Cpu className="w-5 h-5" />
      </motion.button>

      {/* Search Toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => { setSearch(!showSearch); }}
        className={cn(
          "p-3.5 backdrop-blur border rounded-full shadow-2xl transition-all duration-300",
          showSearch ? "bg-minimal-accent border-minimal-accent text-white" : "bg-minimal-bg/90 border-minimal-border text-minimal-muted"
        )}
        title="Find & Replace"
      >
        <Search className="w-5 h-5" />
      </motion.button>

      <div className="h-px bg-minimal-border/30 mx-3 my-1" />

      {/* Semantic Folders toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => setSemanticFolders(!showSemanticFolders)}
        className={cn(
          "p-3.5 backdrop-blur border rounded-full shadow-2xl transition-all duration-300",
          showSemanticFolders ? "bg-minimal-accent border-minimal-accent text-white" : "bg-minimal-bg/90 border-minimal-border text-minimal-muted"
        )}
        title="Semantic Folders"
      >
        <FolderRoot className="w-5 h-5" />
      </motion.button>

      {/* Orientation toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => setDirection(prev => prev === 'ltr' ? 'rtl' : 'ltr')}
        className={cn(
          "p-3.5 backdrop-blur border rounded-full shadow-2xl bg-minimal-bg/90 border-minimal-border text-minimal-muted transition-all duration-300"
        )}
        title={`Switch to ${direction === 'ltr' ? 'RTL' : 'LTR'}`}
      >
        <Languages className="w-5 h-5" />
      </motion.button>

      {/* Daily Goal Toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => {
          const goal = window.prompt("Set your word count goal:", wordGoal.toString());
          if (goal !== null) {
            const parsed = parseInt(goal);
            setWordGoal(parsed || 0);
            localStorage.setItem('ink-quill-goal', (parsed || 0).toString());
          }
        }}
        className={cn(
          "p-3.5 backdrop-blur border rounded-full shadow-2xl transition-all duration-300",
          wordGoal > 0 ? "bg-minimal-accent border-minimal-accent text-white" : "bg-minimal-bg/90 border-minimal-border text-minimal-muted"
        )}
        title="Daily Word Goal"
      >
        <Target className="w-5 h-5" />
      </motion.button>

      <div className="h-px bg-minimal-border/30 mx-3 my-1" />

      {/* Wipe Document */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05, color: '#ef4444' }}
        onClick={clearEditor}
        className="p-3.5 bg-minimal-bg/90 backdrop-blur border border-minimal-border rounded-full shadow-2xl text-minimal-muted transition-all duration-300"
        title="Wipe Document"
      >
        <Trash2 className="w-5 h-5" />
      </motion.button>

      {/* Global Settings Toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={() => setSettings(!showSettings)}
        className={cn(
          "p-3.5 backdrop-blur border rounded-full shadow-2xl transition-all duration-300",
          showSettings ? "bg-minimal-accent border-minimal-accent text-white" : "bg-minimal-bg/90 border-minimal-border text-minimal-muted"
        )}
        title="Global Settings"
      >
        <Settings className="w-5 h-5" />
      </motion.button>
    </div>
  );
};
