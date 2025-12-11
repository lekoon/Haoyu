import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { Risk, RiskCategory, RiskStatus, RiskMitigationAction } from '../types';
import { createRisk, getRiskCategoryInfo, getRiskStatusInfo } from '../utils/riskManagement';

interface RiskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (risk: Risk) => void;
    projectId: string;
    existingRisk?: Risk | null;
    currentUserId: string;
}

const RiskFormModal: React.FC<RiskFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    projectId,
    existingRisk,
    currentUserId,
}) => {
    const [formData, setFormData] = useState<Partial<Risk>>({
        title: '',
        description: '',
        category: 'technical',
        probability: 3,
        impact: 3,
        status: 'identified',
        owner: currentUserId,
        mitigationStrategy: '',
        contingencyPlan: '',
        estimatedCostImpact: undefined,
        mitigationCost: undefined,
    });

    const [mitigationActions, setMitigationActions] = useState<Omit<RiskMitigationAction, 'id'>[]>([]);

    useEffect(() => {
        if (existingRisk) {
            setFormData(existingRisk);
            setMitigationActions(existingRisk.mitigationActions || []);
        } else {
            // Reset form
            setFormData({
                title: '',
                description: '',
                category: 'technical',
                probability: 3,
                impact: 3,
                status: 'identified',
                owner: currentUserId,
                mitigationStrategy: '',
                contingencyPlan: '',
            });
            setMitigationActions([]);
        }
    }, [existingRisk, currentUserId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description) {
            alert('请填写标题和描述');
            return;
        }

        let risk: Risk;
        if (existingRisk) {
            // Update existing risk
            risk = {
                ...existingRisk,
                ...formData,
                mitigationActions: mitigationActions.map((action, idx) => ({
                    ...action,
                    id: action.id || `action-${Date.now()}-${idx}`,
                })) as RiskMitigationAction[],
            } as Risk;
        } else {
            // Create new risk
            risk = createRisk(
                projectId,
                formData.title!,
                formData.category as RiskCategory,
                formData.probability!,
                formData.impact!,
                formData.owner!,
                formData.description!
            );
            risk = {
                ...risk,
                mitigationStrategy: formData.mitigationStrategy || '',
                contingencyPlan: formData.contingencyPlan,
                estimatedCostImpact: formData.estimatedCostImpact,
                mitigationCost: formData.mitigationCost,
                status: formData.status as RiskStatus,
                mitigationActions: mitigationActions.map((action, idx) => ({
                    ...action,
                    id: `action-${Date.now()}-${idx}`,
                })) as RiskMitigationAction[],
            };
        }

        onSave(risk);
        onClose();
    };

    const addMitigationAction = () => {
        setMitigationActions([
            ...mitigationActions,
            {
                description: '',
                owner: currentUserId,
                dueDate: new Date().toISOString().split('T')[0],
                status: 'pending',
            },
        ]);
    };

    const updateMitigationAction = (index: number, field: keyof RiskMitigationAction, value: any) => {
        const updated = [...mitigationActions];
        updated[index] = { ...updated[index], [field]: value };
        setMitigationActions(updated);
    };

    const removeMitigationAction = (index: number) => {
        setMitigationActions(mitigationActions.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {existingRisk ? '编辑风险' : '添加新风险'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    风险标题 *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                                    placeholder="例如：关键技术人员离职风险"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    风险类别 *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value as RiskCategory })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                                >
                                    <option value="schedule">进度风险</option>
                                    <option value="cost">成本风险</option>
                                    <option value="resource">资源风险</option>
                                    <option value="technical">技术风险</option>
                                    <option value="external">外部风险</option>
                                    <option value="quality">质量风险</option>
                                    <option value="scope">范围风险</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    状态
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({ ...formData, status: e.target.value as RiskStatus })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                                >
                                    <option value="identified">已识别</option>
                                    <option value="analyzing">分析中</option>
                                    <option value="mitigating">缓解中</option>
                                    <option value="monitoring">监控中</option>
                                    <option value="resolved">已解决</option>
                                    <option value="accepted">已接受</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    风险描述 *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                                    rows={3}
                                    placeholder="详细描述风险的具体情况..."
                                    required
                                />
                            </div>
                        </div>

                        {/* Risk Assessment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    发生概率 (1-5) *
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={formData.probability}
                                    onChange={(e) =>
                                        setFormData({ ...formData, probability: parseInt(e.target.value) })
                                    }
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>极低</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                        {formData.probability}
                                    </span>
                                    <span>极高</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    影响程度 (1-5) *
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={formData.impact}
                                    onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>可忽略</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                        {formData.impact}
                                    </span>
                                    <span>严重</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    预估成本影响 (¥)
                                </label>
                                <input
                                    type="number"
                                    value={formData.estimatedCostImpact || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            estimatedCostImpact: e.target.value ? parseFloat(e.target.value) : undefined,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    缓解成本 (¥)
                                </label>
                                <input
                                    type="number"
                                    value={formData.mitigationCost || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            mitigationCost: e.target.value ? parseFloat(e.target.value) : undefined,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Mitigation Strategy */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                缓解策略
                            </label>
                            <textarea
                                value={formData.mitigationStrategy}
                                onChange={(e) => setFormData({ ...formData, mitigationStrategy: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                                rows={3}
                                placeholder="描述如何缓解这个风险..."
                            />
                        </div>

                        {/* Contingency Plan */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                应急计划
                            </label>
                            <textarea
                                value={formData.contingencyPlan}
                                onChange={(e) => setFormData({ ...formData, contingencyPlan: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                                rows={2}
                                placeholder="如果缓解措施失败，备用计划是什么..."
                            />
                        </div>

                        {/* Mitigation Actions */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    缓解措施
                                </label>
                                <button
                                    type="button"
                                    onClick={addMitigationAction}
                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Plus size={14} />
                                    添加措施
                                </button>
                            </div>

                            <div className="space-y-3">
                                {mitigationActions.map((action, index) => (
                                    <div
                                        key={index}
                                        className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                                    >
                                        <div className="flex items-start gap-2">
                                            <input
                                                type="text"
                                                value={action.description}
                                                onChange={(e) =>
                                                    updateMitigationAction(index, 'description', e.target.value)
                                                }
                                                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
                                                placeholder="措施描述..."
                                            />
                                            <input
                                                type="date"
                                                value={action.dueDate}
                                                onChange={(e) => updateMitigationAction(index, 'dueDate', e.target.value)}
                                                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeMitigationAction(index)}
                                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {existingRisk ? '保存更改' : '创建风险'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RiskFormModal;
