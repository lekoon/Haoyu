import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Edit3, AlertCircle } from 'lucide-react';
import type { Project } from '../types';

interface BatchEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProjects: Project[];
    onBatchUpdate: (updates: Partial<Project>) => void;
}

type EditField = 'status' | 'priority' | 'owner' | 'tags' | 'none';

const BatchEditModal: React.FC<BatchEditModalProps> = ({
    isOpen,
    onClose,
    selectedProjects,
    onBatchUpdate,
}) => {
    const [selectedField, setSelectedField] = useState<EditField>('none');
    const [newStatus, setNewStatus] = useState<Project['status']>('planning');
    const [newPriority, setNewPriority] = useState<Project['priority']>('P2');
    const [newOwner, setNewOwner] = useState('');
    const [newTags, setNewTags] = useState('');

    const handleApply = () => {
        const updates: Partial<Project> = {};

        switch (selectedField) {
            case 'status':
                updates.status = newStatus;
                break;
            case 'priority':
                updates.priority = newPriority;
                break;
            case 'owner':
                if (newOwner.trim()) {
                    updates.owner = newOwner.trim();
                }
                break;
            case 'tags':
                if (newTags.trim()) {
                    updates.tags = newTags.split(',').map((t) => t.trim()).filter(Boolean);
                }
                break;
        }

        if (Object.keys(updates).length > 0) {
            onBatchUpdate(updates);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Edit3 className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">批量编辑</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    已选择 {selectedProjects.length} 个项目
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Field Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                选择要编辑的字段
                            </label>
                            <select
                                value={selectedField}
                                onChange={(e) => setSelectedField(e.target.value as EditField)}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="none">-- 请选择 --</option>
                                <option value="status">项目状态</option>
                                <option value="priority">优先级</option>
                                <option value="owner">负责人</option>
                                <option value="tags">标签</option>
                            </select>
                        </div>

                        {/* Field-specific inputs */}
                        {selectedField === 'status' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    新状态
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as Project['status'])}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="planning">规划中</option>
                                    <option value="active">进行中</option>
                                    <option value="on-hold">暂停</option>
                                    <option value="completed">已完成</option>
                                </select>
                            </motion.div>
                        )}

                        {selectedField === 'priority' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    新优先级
                                </label>
                                <select
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value as Project['priority'])}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="P0">P0 - 紧急</option>
                                    <option value="P1">P1 - 高</option>
                                    <option value="P2">P2 - 中</option>
                                    <option value="P3">P3 - 低</option>
                                </select>
                            </motion.div>
                        )}

                        {selectedField === 'owner' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    新负责人
                                </label>
                                <input
                                    type="text"
                                    value={newOwner}
                                    onChange={(e) => setNewOwner(e.target.value)}
                                    placeholder="输入负责人姓名"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </motion.div>
                        )}

                        {selectedField === 'tags' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    新标签
                                </label>
                                <input
                                    type="text"
                                    value={newTags}
                                    onChange={(e) => setNewTags(e.target.value)}
                                    placeholder="输入标签，用逗号分隔"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    例如: 重要, 紧急, 客户项目
                                </p>
                            </motion.div>
                        )}

                        {/* Warning */}
                        {selectedField !== 'none' && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                            批量编辑警告
                                        </p>
                                        <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                                            此操作将更新所有选中的 {selectedProjects.length} 个项目。请确认后再继续。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Selected Projects Preview */}
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                将要更新的项目:
                            </p>
                            <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-1">
                                {selectedProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2"
                                    >
                                        <Check size={14} className="text-green-600" />
                                        {project.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={selectedField === 'none'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Check size={18} />
                            应用更改
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BatchEditModal;
