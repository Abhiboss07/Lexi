import { SearchX, ArrowRight } from 'lucide-react';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  description: string;
}

interface ExploreSearchResultsProps {
  query: string;
  results: SearchResultItem[];
  onSelectResult: (item: SearchResultItem) => void;
  onClearSearch: () => void;
}

export const ExploreSearchResults: React.FC<ExploreSearchResultsProps> = ({
  query,
  results,
  onSelectResult,
  onClearSearch,
}) => {
  if (results.length === 0) {
    return (
      <div className="rounded-[26px] bg-white border border-[#E4E7F7] p-8 text-center space-y-3 shadow-[0_4px_20px_rgba(35,38,85,0.04)]">
        <div className="w-12 h-12 rounded-2xl bg-[#EFF1FE] text-[#545CA6] mx-auto flex items-center justify-center">
          <SearchX className="w-6 h-6 stroke-[2]" />
        </div>
        <h3 className="text-[16px] font-bold text-[#15164B]">
          No activities found
        </h3>
        <p className="text-[12px] text-[#6B7094] max-w-[260px] mx-auto leading-relaxed">
          We couldn't find any lessons or adventures matching "{query}". Try searching for <span className="font-semibold text-[#545CA6]">airport</span>, <span className="font-semibold text-[#545CA6]">interview</span>, or <span className="font-semibold text-[#545CA6]">stories</span>.
        </p>
        <button
          onClick={onClearSearch}
          className="inline-flex px-4 py-2 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-semibold transition-colors cursor-pointer"
        >
          Clear Search
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold text-[#545CA6]">
          Found {results.length} result{results.length === 1 ? '' : 's'} for "{query}"
        </span>
        <button
          onClick={onClearSearch}
          className="text-[11.5px] font-medium text-[#7D82A8] hover:text-[#15164B] transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div className="space-y-2">
        {results.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectResult(item)}
            className="group flex items-center justify-between gap-3 overflow-hidden rounded-[20px] bg-white border border-[#E4E7F7] p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer hover:border-[#D5D9F4]"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectResult(item);
              }
            }}
            aria-label={`Open search result ${item.title}`}
          >
            <div className="flex-1 min-w-0">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#545CA6] block">
                {item.category} • {item.badge}
              </span>
              <h4 className="text-[14px] font-extrabold text-[#15164B] truncate group-hover:text-[#545CA6] transition-colors mt-0.5">
                {item.title}
              </h4>
              <p className="text-[11.5px] text-[#6B7094] truncate mt-0.5">
                {item.subtitle}
              </p>
            </div>
            <div className="shrink-0 w-7 h-7 rounded-full bg-[#F0F2FC] group-hover:bg-[#15164B] text-[#15164B] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
