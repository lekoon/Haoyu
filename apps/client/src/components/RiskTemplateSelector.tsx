import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Filter } from 'lucide-react';
import { RISK_TEMPLATES, searchTemplates } from '../utils/riskTemplates';
import type { RiskTemplate, RiskCategory } from '../types';
import { getRiskCategoryInfo } from '../utils/riskManagement';

interface RiskTemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: RiskTemplate) => void;
}

const RiskTemplateSelector: React.FC<RiskTemplateSelectorProps> = ({ isOpen, onClose, onSelectTemplate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<RiskCategory | 'all'>('all');

    const filteredTemplates = useMemo(() => {
        let templates = RISK_TEMPLATES;

        // Filter by search query
        if (searchQuery.trim()) {
            templates = searchTemplates(searchQuery);
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            templates = templates.filter((t) => t.category === selectedCategory);
        }

        return templates;
    }, [searchQuery, selectedCategory]);

    const categories: Array<{ value: RiskCategory | 'all'; label: string }> = [
        { value: 'all', label: '全部' },
        { value: 'schedule', label: '进度风险' },
        { value: 'cost', label: '成本风险' },
        { value: 'resource', label: '资源风险' },
        { value: 'technical', label: '技术风险' },
        { value: 'external', label: '外部风险' },
        { value: 'quality', label: '质量风险' },
        { value: 'scope', label: '范围风险' },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">风险模板库</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                选择常见风险模板快速创建风险
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search and Filter */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                                size={18}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索风险模板..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter size={16} className="text-slate-500" />
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setSelectedCategory(cat.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template List */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {filteredTemplates.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-500 dark:text-slate-400">未找到匹配的风险模板</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredTemplates.map((template) => {
                                    const categoryInfo = getRiskCategoryInfo(template.category);
                                    return (
                                        <motion.div
                                            key={template.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                                            onClick={() => {
                                                onSelectTemplate(template);
                                                onClose();
                                            }}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{categoryInfo.icon}</span>
                                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                                                        {template.name}
                                                    </h3>
                                                </div>
                                                <button className="p-1.5 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                                                {template.description}
                                            </p>

                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    概率: {template.probability}/5
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">•</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    影响: {template.impact}/5
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">•</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    分数: {template.probability * template.impact}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                {template.tags.slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                            💡 提示：点击任意模板即可基于该模板创建风险，您可以在创建后进一步自定义
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RiskTemplateSelector;
