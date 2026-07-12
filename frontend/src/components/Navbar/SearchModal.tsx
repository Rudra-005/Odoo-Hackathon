import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
}

export const SearchModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`common/search/?q=${query}`);
        if (Array.isArray(response.data)) {
          setResults(response.data);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-lg py-1"
            placeholder="Search vehicles, drivers, trips..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && <Loader2 className="w-5 h-5 text-primary-500 animate-spin mx-2 shrink-0" />}
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <p>Type to start searching...</p>
            </div>
          )}

          {query && !isLoading && results.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <p>No results found for "{query}"</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    navigate(result.url);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {result.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {result.subtitle}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded uppercase tracking-wider">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
