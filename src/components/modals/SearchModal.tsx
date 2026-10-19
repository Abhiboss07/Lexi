import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, MessageSquare, Sparkles, Headphones, Briefcase, FileText } from 'lucide-react';
import { searchCurriculum, type CurriculumSearchResult } from '../../services/curriculumSearchService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic?: (topic: string) => void;
  onSelectResult?: (result: CurriculumSearchResult) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    return searchCurriculum(query);
  }, [query]);

  if (!isOpen) return null;

  const getResultIcon = (result: CurriculumSearchResult) => {
    if (result.type === 'studio') {
      switch (result.studioKey) {
        case 'conversation':
          return MessageSquare;
        case 'listening':
          return Headphones;
        case 'interview':
          return Briefcase;
        case 'grammar':
          return FileText;
        default:
          return Sparkles;
      }
    }
    return BookOpen;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-xs p-4 pt-16 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Search curriculum lessons and studios"
    >
      <div className="w-full max-w-[480px] bg-white rounded-3xl p-5 shadow-2xl border border-[#ECEEFE]">
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
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] flex items-center justify-center text-[#222149] transition-colors"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="pt-3 max-h-[380px] overflow-y-auto space-y-1.5 no-scrollbar">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E93B8] px-2 block mb-1">
            {query.trim() ? `Search Results (${searchResults.length})` : 'Recommended Topics & Studios'}
          </span>
          {searchResults.length > 0 ? (
            searchResults.map((item) => {
              const Icon = getResultIcon(item);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onSelectResult) {
                      onSelectResult(item);
                    } else if (onSelectTopic) {
                      onSelectTopic(item.title);
                    }
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#F6F7FE] text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-xl bg-[#F0F2FD] group-hover:bg-[#E2E6FB] flex items-center justify-center text-[#232655] shrink-0 transition-colors">
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#646AA4] block leading-none mb-0.5">
                        {item.category}
                      </span>
                      <h4 className="text-[13px] font-bold text-[#222149] group-hover:text-[#232655] truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] font-medium text-[#7D82A8] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  {item.levelBadge && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] shrink-0">
                      {item.levelBadge}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-[#7D82A8] text-[13px]">
              No matching lessons or studios found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
