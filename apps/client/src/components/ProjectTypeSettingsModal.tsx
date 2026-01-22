import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useStore, useProjectTypeDefinitions } from '../store/useStore';
import { Button } from './ui';

interface ProjectTypeSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProjectTypeSettingsModal: React.FC<ProjectTypeSettingsModalProps> = ({ isOpen, onClose }) => {
    const projectTypes = useProjectTypeDefinitions();
    const { addProjectTypeDefinition, updateProjectTypeDefinition, deleteProjectTypeDefinition } = useStore();
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#3b82f6');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newName.trim()) return;
        addProjectTypeDefinition(newName.trim(), newColor);
        setNewName('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">项目类型配置</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">管理可用的项目分类类型</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* List of existing types */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {projectTypes.map((type) => (
                            <div key={type.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group">
                                <input
                                    type="color"
                                    value={type.color}
                                    onChange={(e) => updateProjectTypeDefinition(type.id, { color: e.target.value })}
                                    className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={type.name}
                                    onChange={(e) => updateProjectTypeDefinition(type.id, { name: e.target.value })}
                                    className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-sm text-slate-700 dark:text-slate-200"
                                />
                                <button
                                    onClick={() => deleteProjectTypeDefinition(type.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add new type */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">添加新类型</h3>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                className="w-12 h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer p-1"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="输入类型名称..."
                                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-sm"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                            </div>
                            <Button
                                variant="primary"
                                icon={Plus}
                                onClick={handleAdd}
                                className="h-12 w-12 flex items-center justify-center p-0 rounded-2xl"
                            >
                                <span className="sr-only">添加</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                    <Button variant="outline" onClick={onClose} className="rounded-xl px-8 font-bold text-sm">
                        完成
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProjectTypeSettingsModal;
