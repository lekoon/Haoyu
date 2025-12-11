import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, X, FileText, User, Layers, Layout, Kanban, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { aggregateSearch, SearchResult, SearchResultType } from '../utils/searchEngine';
import { useTranslation } from 'react-i18next';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Get data from store
    const { projects, resourcePool, projectTemplates } = useStore();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                const searchResults = aggregateSearch(query, {
                    projects,
                    resources: resourcePool,
                    templates: projectTemplates
                });
                setResults(searchResults);
                setSelectedIndex(0);
            } else {
                setResults([]);
            }
        }, 150); // Debounce

        return () => clearTimeout(timer);
    }, [query, projects, resourcePool, projectTemplates]);

    // Handle Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (results[selectedIndex]) {
                        handleSelect(results[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    // Ensure selected item is in view
    useEffect(() => {
        if (listRef.current && results.length > 0) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, results]);

    const handleSelect = (result: SearchResult) => {
        navigate(result.path);
        onClose();
    };

    const getIcon = (type: SearchResultType) => {
        switch (type) {
            case 'project': return <Layers className="text-blue-500" size={18} />;
            case 'resource': return <User className="text-purple-500" size={18} />;
            case 'task': return <Kanban className="text-green-500" size={18} />;
            case 'template': return <FileText className="text-orange-500" size={18} />;
            case 'page': return <Layout className="text-slate-500" size={18} />;
            default: return <Search size={18} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[70vh]">
                {/* Search Header */}
                <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-700">
                    <Search className="text-slate-400 mr-3" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('search.placeholder', 'Search projects, resources, tasks, pages...')}
                        className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        autoComplete="off"
                    />
                    <div className="flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            ESC
                        </kbd>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <X className="text-slate-400" size={20} />
                        </button>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-2" ref={listRef}>
                    {results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((result, index) => (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    className={`
                                        flex items-center p-3 rounded-lg cursor-pointer transition-colors
                                        ${index === selectedIndex
                                            ? 'bg-blue-50 dark:bg-blue-900/30'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                                    `}
                                >
                                    <div className={`
                                        p-2 rounded-lg mr-4 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 shadow-sm
                                    `}>
                                        {getIcon(result.type)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {result.title}
                                            </h4>
                                            {index === selectedIndex && (
                                                <ArrowRight size={14} className="text-blue-500 ml-2 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {result.subtitle}
                                        </p>
                                    </div>
                                    {result.tags && result.tags.length > 0 && (
                                        <div className="hidden sm:flex items-center gap-1 ml-4">
                                            {result.tags.slice(0, 2).map((tag, i) => (
                                                <span key={i} className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="py-12 text-center text-slate-500">
                            <Search className="mx-auto mb-3 opacity-20" size={48} />
                            <p>No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-400">
                            <Command className="mx-auto mb-3 opacity-20" size={48} />
                            <p>Type to search across the entire system</p>
                            <div className="flex justify-center gap-4 mt-6 text-xs opacity-60">
                                <span className="flex items-center"><Layers size={12} className="mr-1" /> Projects</span>
                                <span className="flex items-center"><User size={12} className="mr-1" /> Resources</span>
                                <span className="flex items-center"><Kanban size={12} className="mr-1" /> Tasks</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 flex justify-between">
                        <span>{results.length} results found</span>
                        <div className="flex gap-3">
                            <span className="flex items-center"><span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded mr-1">↑↓</span> to navigate</span>
                            <span className="flex items-center"><span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded mr-1">↵</span> to select</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
