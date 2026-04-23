import React from 'react';
import { motion } from 'motion/react';
import { History, Plus, X } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';

interface SnapshotsMenuProps {
  showSnapshots: boolean;
  setShowSnapshots: (val: boolean) => void;
  takeSnapshot: () => Promise<void>;
  setMarkdown: (content: string) => void;
}

export const SnapshotsMenu: React.FC<SnapshotsMenuProps> = ({
  showSnapshots,
  setShowSnapshots,
  takeSnapshot,
  setMarkdown
}) => {
  const { snapshots, setSnapshots } = useEditorStore();

  return (
    <div className="relative">
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.5, x: 0 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        className="p-3.5 bg-minimal-bg/90 backdrop-blur border border-minimal-border rounded-full shadow-2xl text-minimal-muted transition-all duration-300"
        onClick={() => setShowSnapshots(!showSnapshots)} title="Document Snapshots"
      >
        <History className="w-5 h-5" />
      </motion.button>

      {showSnapshots && (
        <div className="absolute right-full mr-4 top-0 flex flex-col gap-1 w-48 bg-minimal-bg border border-minimal-border rounded-2xl shadow-2xl p-2 z-[60]">
          <div className="px-3 py-1.5 border-b border-minimal-border flex items-center justify-between">
            <span className="text-[9px] font-bold text-minimal-muted uppercase tracking-widest">Snapshots</span>
            <button onClick={takeSnapshot} className="p-1 hover:bg-minimal-accent/10 rounded-lg group/plus">
              <Plus className="w-3 h-3 text-minimal-accent group-hover/plus:rotate-90 transition-transform" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto p-1 py-1.5 space-y-1">
            {snapshots.length === 0 ? (
              <p className="text-[9px] text-center text-minimal-muted/50 py-4 italic font-medium">No snapshots yet</p>
            ) : (
              snapshots.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    if (window.confirm("Restore this version? Your current work will be overwritten.")) {
                      setMarkdown(s.content);
                    }
                  }}
                  className="w-full text-left p-2 hover:bg-minimal-sidebar rounded-xl transition-all border border-transparent hover:border-minimal-border group/s cursor-pointer"
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-bold text-minimal-text">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSnapshots(prev => prev.filter(snap => snap.id !== s.id));
                      }}
                      className="opacity-0 group-hover/s:opacity-100 p-1 hover:text-red-500 transition-all font-bold"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <p className="text-[8px] text-minimal-muted truncate">{s.content.substring(0, 40)}...</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
