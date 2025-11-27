import React, { useState } from 'react';
import type { ProjectTemplate } from '../types';
import { FileText, X, Check, Sparkles } from 'lucide-react';

interface TemplateSelectorProps {
    templates: ProjectTemplate[];
    onSelect: (template: ProjectTemplate | null) => void;
    onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, onSelect, onClose }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
    const [filter, setFilter] = useState<string>('all');

    const categories = [
        { id: 'all', label: '全部', icon: Sparkles },
        { id: 'web', label: 'Web应用', icon: FileText },
        { id: 'mobile', label: '移动应用', icon: FileText },
        { id: 'data', label: '数据分析', icon: FileText },
        { id: 'infrastructure', label: '基础设施', icon: FileText },
        { id: 'custom', label: '自定义', icon: FileText },
    ];

    const filteredTemplates = filter === 'all'
        ? templates
        : templates.filter(t => t.category === filter);

    const handleConfirm = () => {
        onSelect(selectedTemplate);
        onClose();
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            web: 'from-blue-500 to-cyan-500',
            mobile: 'from-purple-500 to-pink-500',
            data: 'from-green-500 to-emerald-500',
            infrastructure: 'from-orange-500 to-red-500',
            custom: 'from-slate-500 to-gray-500',
        };
        return colors[category] || 'from-blue-500 to-purple-500';
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">选择项目模板</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                使用模板快速创建项目，或从空白项目开始
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {categories.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === cat.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Blank Template Option */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">从头开始</h3>
                        <div
                            onClick={() => setSelectedTemplate(null)}
                            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${selectedTemplate === null
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText size={20} className="text-slate-400" />
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100">空白项目</h4>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        创建一个全新的项目，自定义所有设置
                                    </p>
                                </div>
                                {selectedTemplate === null && (
                                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                        <Check size={16} className="text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Template Cards */}
                    {filteredTemplates.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                可用模板 ({filteredTemplates.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template)}
                                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(template.category)} flex items-center justify-center text-white shadow-lg`}>
                                                <FileText size={24} />
                                            </div>
                                            {selectedTemplate?.id === template.id && (
                                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                                    <Check size={16} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            {template.name}
                                        </h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                                            {template.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                                                {template.defaultDuration} 个月
                                            </span>
                                            {template.isBuiltIn && (
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                    内置
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredTemplates.length === 0 && filter !== 'all' && (
                        <div className="text-center py-12">
                            <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">该分类暂无模板</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedTemplate ? (
                            <span>已选择: <strong className="text-slate-700 dark:text-slate-300">{selectedTemplate.name}</strong></span>
                        ) : (
                            <span>将创建空白项目</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
                        >
                            确认选择
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateSelector;
