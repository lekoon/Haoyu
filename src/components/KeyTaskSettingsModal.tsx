import React, { useState } from 'react';
import { X, Plus, Trash2, Palette } from 'lucide-react';
import { useKeyTaskDefinitions, useStore } from '../store/useStore';
import Button from './ui/Button';

interface KeyTaskSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const KeyTaskSettingsModal: React.FC<KeyTaskSettingsModalProps> = ({ isOpen, onClose }) => {
    const keyTaskDefinitions = useKeyTaskDefinitions();
    const { addKeyTaskDefinition, updateKeyTaskDefinition, deleteKeyTaskDefinition } = useStore();
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#3b82f6');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (newName.trim()) {
            addKeyTaskDefinition(newName.trim(), newColor);
            setNewName('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Palette className="text-blue-500" size={24} />
                        关键任务设置
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Add New */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="任务名称 (如: SIT)"
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                        <input
                            type="color"
                            className="w-12 h-10 p-1 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                        />
                        <Button onClick={handleAdd} size="sm" icon={Plus}>添加</Button>
                    </div>

                    {/* List */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {keyTaskDefinitions.map((kt) => (
                            <div key={kt.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group transition-all hover:shadow-sm">
                                <input
                                    type="color"
                                    className="w-8 h-8 rounded p-0 border-none cursor-pointer shrink-0"
                                    value={kt.color}
                                    onChange={(e) => updateKeyTaskDefinition(kt.id, { color: e.target.value })}
                                />
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 dark:text-slate-300"
                                    value={kt.name}
                                    onChange={(e) => updateKeyTaskDefinition(kt.id, { name: e.target.value })}
                                />
                                <button
                                    onClick={() => deleteKeyTaskDefinition(kt.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button onClick={onClose} variant="ghost">完成</Button>
                </div>
            </div>
        </div>
    );
};

export default KeyTaskSettingsModal;
