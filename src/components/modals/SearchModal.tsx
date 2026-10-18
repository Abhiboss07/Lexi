import React from 'react';
import { X, Search, BookOpen, MessageSquare, Sparkles } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
}) => {
  const [query, setQuery] = React.useState('');

  if (!isOpen) return null;

  const topics = [
    { id: '1', title: 'Ordering food at a café', category: 'Conversation', icon: MessageSquare },
    { id: '2', title: 'Present Simple vs Present Continuous', category: 'Grammar', icon: BookOpen },
    { id: '3', title: 'Airport check-in & boarding vocabulary', category: 'Vocabulary', icon: Sparkles },
    { id: '4', title: 'Job interview self-introduction', category: 'Career', icon: MessageSquare },
    { id: '5', title: 'Past simple regular and irregular verbs', category: 'Grammar', icon: BookOpen },
  ];

  const filtered = query.trim()
    ? topics.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase()))
    : topics;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-xs p-4 pt-16 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[460px] bg-white rounded-3xl p-5 shadow-2xl border border-[#ECEEFE]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#ECEEFE]">
          <Search className="w-5 h-5 text-[#646AA4] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grammar, stories, topics..."
            autoFocus
            className="w-full text-[15px] font-medium text-[#222149] placeholder:text-[#9AA0C2] focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] flex items-center justify-center text-[#222149]"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="pt-3 max-h-[340px] overflow-y-auto space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E93B8] px-2 block mb-1">
            Recommended Topics
          </span>
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTopic(item.title);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#F6F7FE] text-left transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F0F2FD] group-hover:bg-[#E2E6FB] flex items-center justify-center text-[#232655] shrink-0">
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#222149] group-hover:text-[#232655]">
                      {item.title}
                    </h4>
                    <span className="text-[11px] font-medium text-[#7D82A8]">
                      {item.category}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-[#7D82A8] text-[13px]">
              No matching lessons found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
