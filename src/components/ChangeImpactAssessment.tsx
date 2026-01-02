import React, { useState } from 'react';
import { AlertTriangle, DollarSign, Clock, TrendingUp, X } from 'lucide-react';
import type { ChangeRequest, Project } from '../types';
import { validateChangeRequest } from '../utils/scopeManagement';
import { Button, Card } from './ui';

interface ChangeImpactAssessmentProps {
    project: Project;
    onSubmit: (changeRequest: Omit<ChangeRequest, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
    currentUser: { id: string; name: string };
}

export const ChangeImpactAssessment: React.FC<ChangeImpactAssessmentProps> = ({
    project,
    onSubmit,
    onCancel,
    currentUser,
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'scope' as const,
        estimatedEffortHours: 0,
        estimatedCostIncrease: 0,
        scheduleImpactDays: 0,
        impactLevel: 'medium' as const,
        businessJustification: '',
        alternativeConsidered: '',
        riskIfNotImplemented: '',
    });

    const [validation, setValidation] = useState<{
        isValid: boolean;
        warnings: string[];
        errors: string[];
    } | null>(null);

    const handleChange = (field: string, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);

        // 实时验证
        if (field === 'estimatedCostIncrease' || field === 'scheduleImpactDays' || field === 'businessJustification') {
            const tempChangeRequest: ChangeRequest = {
                id: 'temp',
                projectId: project.id,
                projectName: project.name,
                requestedBy: currentUser.id,
                requestedByName: currentUser.name,
                requestDate: new Date().toISOString(),
                status: 'draft',
                createdAt: new Date().toISOString(),
                ...newData,
            };
            setValidation(validateChangeRequest(project, tempChangeRequest));
        }
    };

    const handleSubmit = () => {
        const changeRequest: Omit<ChangeRequest, 'id' | 'createdAt'> = {
            projectId: project.id,
            projectName: project.name,
            requestedBy: currentUser.id,
            requestedByName: currentUser.name,
            requestDate: new Date().toISOString(),
            status: 'pending',
            ...formData,
        };

        const finalValidation = validateChangeRequest(project, changeRequest as ChangeRequest);
        setValidation(finalValidation);

        if (finalValidation.isValid) {
            onSubmit(changeRequest);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-orange-500" />
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                变更影响评估
                            </h2>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Warning Banner */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                            <strong>重要提示：</strong> 所有变更必须进行影响评估。请如实填写工时、成本和进度影响。
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                变更标题 *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                                placeholder="简要描述变更内容"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                详细描述 *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                                placeholder="详细说明变更的具体内容"
                            />
                        </div>

                        {/* Impact Assessment - 强制填写 */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                                影响评估（必填）
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        增加工时（小时）*
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.estimatedEffortHours}
                                        onChange={(e) => handleChange('estimatedEffortHours', Number(e.target.value))}
                                        min="0"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <DollarSign className="w-4 h-4 inline mr-1" />
                                        增加成本（元）*
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.estimatedCostIncrease}
                                        onChange={(e) => handleChange('estimatedCostIncrease', Number(e.target.value))}
                                        min="0"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <TrendingUp className="w-4 h-4 inline mr-1" />
                                        延后天数 *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.scheduleImpactDays}
                                        onChange={(e) => handleChange('scheduleImpactDays', Number(e.target.value))}
                                        min="0"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Business Justification */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                业务理由 * （至少 20 字符）
                            </label>
                            <textarea
                                value={formData.businessJustification}
                                onChange={(e) => handleChange('businessJustification', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
                                placeholder="为什么必须进行这个变更？对业务有什么价值？"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                {formData.businessJustification.length} / 20 字符
                            </p>
                        </div>

                        {/* Validation Messages */}
                        {validation && (
                            <div className="space-y-2">
                                {validation.errors.map((error, index) => (
                                    <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                                    </div>
                                ))}
                                {validation.warnings.map((warning, index) => (
                                    <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <Button
                            onClick={handleSubmit}
                            disabled={!validation?.isValid}
                            className="flex-1"
                        >
                            提交变更请求
                        </Button>
                        <Button onClick={onCancel} variant="outline" className="flex-1">
                            取消
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ChangeImpactAssessment;
