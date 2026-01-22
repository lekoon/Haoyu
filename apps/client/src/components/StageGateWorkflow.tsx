import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Circle, XCircle,
    ChevronRight, Check, FileText, ShieldAlert, Clock
} from 'lucide-react';
import type { ProjectWithStageGate, StageGate, ProjectStage } from '../types';
import {
    getStageName,
    getNextStage,
    canApproveGate,
    getGateCompletionPercentage,
    getGateStatusColor,
    getGateStatusLabel,
    approveGate,
    rejectGate,
    updateRequirement,
    requestGate
} from '../utils/stageGateManagement';

interface StageGateWorkflowProps {
    project: ProjectWithStageGate;
    onUpdateGate: (gate: StageGate) => void;
    onMoveToNextStage: () => void;
    currentUserId: string;
    currentUserName: string;
    userRole: 'admin' | 'manager' | 'user' | 'readonly';
    onRequestApproval?: (gate: StageGate) => void;
}

const StageGateWorkflow: React.FC<StageGateWorkflowProps> = ({
    project,
    onUpdateGate,
    onMoveToNextStage,
    currentUserId,
    currentUserName,
    userRole,
    onRequestApproval
}) => {
    const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
    const [approvalComments, setApprovalComments] = useState('');
    const [approvalConditions, setApprovalConditions] = useState('');

    const isPMO = userRole === 'admin';
    const isPM = userRole === 'manager';
    const canManageRequirements = isPM || isPMO;

    const currentStageIndex = ['initiation', 'planning', 'execution', 'monitoring', 'closing'].indexOf(project.currentStage);

    const handleToggleRequirement = (gate: StageGate, requirementId: string, completed: boolean) => {
        const updatedGate = updateRequirement(gate, requirementId, completed, currentUserId);
        onUpdateGate(updatedGate);
    };

    const handleRequestGate = (gate: StageGate) => {
        const updatedGate = requestGate(gate);
        onUpdateGate(updatedGate);
        if (onRequestApproval) {
            onRequestApproval(updatedGate);
        }
    };

    const handleApproveGate = (gate: StageGate) => {
        const conditions = approvalConditions.trim()
            ? approvalConditions.split('\n').filter(c => c.trim())
            : undefined;

        const updatedGate = approveGate(
            gate,
            currentUserId,
            currentUserName,
            approvalComments || undefined,
            conditions
        );

        onUpdateGate(updatedGate);
        setSelectedGateId(null);
        setApprovalComments('');
        setApprovalConditions('');
    };

    const handleRejectGate = (gate: StageGate) => {
        if (!approvalComments.trim()) {
            alert('请输入拒绝原因');
            return;
        }

        const updatedGate = rejectGate(gate, currentUserId, currentUserName, approvalComments);
        onUpdateGate(updatedGate);
        setSelectedGateId(null);
        setApprovalComments('');
    };

    const StageIndicator: React.FC<{ stage: ProjectStage; index: number }> = ({ stage, index }) => {
        const isActive = index === currentStageIndex;
        const isPassed = index < currentStageIndex;
        const gate = project.gates.find(g => g.stage === stage);

        return (
            <div className="flex flex-col items-center">
                <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 ${isPassed ? 'border-green-500 bg-green-100 dark:bg-green-900/20' :
                    isActive ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/20' :
                        'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'
                    }`}>
                    {isPassed ? (
                        <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
                    ) : isActive ? (
                        <Circle className="text-blue-600 dark:text-blue-400" size={32} />
                    ) : (
                        <Circle className="text-slate-400 dark:text-slate-600" size={32} />
                    )}
                </div>
                <div className="mt-2 text-center">
                    <div className={`text-sm font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                        {getStageName(stage)}
                    </div>
                    {gate && (
                        <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${getGateStatusColor(gate.status)}`}>
                            {getGateStatusLabel(gate.status)}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Stage Progress */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">
                    项目阶段进度
                </h3>
                <div className="flex items-center justify-between">
                    {(['initiation', 'planning', 'execution', 'monitoring', 'closing'] as ProjectStage[]).map((stage, index) => (
                        <React.Fragment key={stage}>
                            <StageIndicator stage={stage} index={index} />
                            {index < 4 && (
                                <ChevronRight
                                    className={`mx-2 ${index < currentStageIndex
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-slate-300 dark:text-slate-600'
                                        }`}
                                    size={24}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Gates List */}
            <div className="space-y-4">
                {project.gates.map((gate) => {
                    const completion = getGateCompletionPercentage(gate);
                    const canApprove = canApproveGate(gate);
                    const isExpanded = selectedGateId === gate.id;

                    return (
                        <div
                            key={gate.id}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            {/* Gate Header */}
                            <div
                                className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                onClick={() => setSelectedGateId(isExpanded ? null : gate.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                {gate.name}
                                            </h4>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGateStatusColor(gate.status)}`}>
                                                {getGateStatusLabel(gate.status)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            {gate.description}
                                        </p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                            {completion}%
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            完成度
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completion}%` }}
                                        className={`h-full ${completion === 100 ? 'bg-green-500' :
                                            completion >= 50 ? 'bg-blue-500' :
                                                'bg-orange-500'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Gate Details */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="p-4 space-y-4">
                                            {/* Requirements Checklist */}
                                            <div>
                                                <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                                                    检查清单
                                                </h5>
                                                <div className="space-y-2">
                                                    {gate.requirements.map(req => (
                                                        <div
                                                            key={req.id}
                                                            className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                                                        >
                                                            <button
                                                                onClick={() => canManageRequirements && handleToggleRequirement(gate, req.id, !req.completed)}
                                                                disabled={!canManageRequirements || gate.status === 'approved' || gate.status === 'requested'}
                                                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${req.completed
                                                                    ? 'bg-green-500 border-green-500'
                                                                    : 'border-slate-300 dark:border-slate-600 hover:border-green-500'
                                                                    } ${!canManageRequirements || gate.status === 'approved' || gate.status === 'requested' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            >
                                                                {req.completed && <Check size={14} className="text-white" />}
                                                            </button>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-sm ${req.completed
                                                                        ? 'text-slate-500 dark:text-slate-400 line-through'
                                                                        : 'text-slate-900 dark:text-slate-100'
                                                                        }`}>
                                                                        {req.description}
                                                                    </span>
                                                                    {req.required && (
                                                                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded-full">
                                                                            必需
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {req.completedDate && (
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                                        完成于 {new Date(req.completedDate).toLocaleDateString('zh-CN')}
                                                                        {req.completedBy && ` by ${req.completedBy}`}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Approval/Request Section */}
                                            {gate.status === 'pending' && isPM && (
                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">发起审批申请</div>
                                                                <p className="text-xs text-slate-500">已完成所有必需项，可申请 PMO 审核进入下一阶段</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRequestGate(gate)}
                                                            disabled={!canApprove}
                                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap flex-shrink-0"
                                                        >
                                                            提交申请
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {gate.status === 'requested' && isPMO && (
                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <h5 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                                        <ShieldAlert size={16} /> PMO 审批决策
                                                    </h5>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase ml-1">
                                                                    审批意见
                                                                </label>
                                                                <textarea
                                                                    value={approvalComments}
                                                                    onChange={(e) => setApprovalComments(e.target.value)}
                                                                    rows={2}
                                                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                                    placeholder="请输入详细的评审意见..."
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase ml-1">
                                                                    附加条件 (可选)
                                                                </label>
                                                                <textarea
                                                                    value={approvalConditions}
                                                                    onChange={(e) => setApprovalConditions(e.target.value)}
                                                                    rows={2}
                                                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                                    placeholder="每行一个附加执行条件..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleApproveGate(gate)}
                                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-green-500/20 whitespace-nowrap flex-shrink-0"
                                                            >
                                                                <CheckCircle size={18} />
                                                                批准通过
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectGate(gate)}
                                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-500/20 whitespace-nowrap flex-shrink-0"
                                                            >
                                                                <XCircle size={18} />
                                                                拒绝申请
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {gate.status === 'requested' && !isPMO && (
                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl flex items-center gap-3">
                                                        <Clock size={20} className="text-amber-600" />
                                                        <div className="text-sm text-amber-700 dark:text-amber-400 font-medium">已提交申请，请等待 PMO 审核通过。</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Approval Info */}
                                            {gate.status !== 'pending' && (
                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                                        <FileText size={16} className="text-slate-600 dark:text-slate-400 mt-0.5" />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                {gate.approvedByName || gate.approvedBy} · {new Date(gate.approvalDate!).toLocaleDateString('zh-CN')}
                                                            </div>
                                                            {gate.comments && (
                                                                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                                    {gate.comments}
                                                                </div>
                                                            )}
                                                            {gate.conditions && gate.conditions.length > 0 && (
                                                                <div className="mt-2">
                                                                    <div className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                                                                        附加条件：
                                                                    </div>
                                                                    <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400">
                                                                        {gate.conditions.map((condition, i) => (
                                                                            <li key={i}>{condition}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Move to Next Stage Button */}
            {isPMO && getNextStage(project.currentStage) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                准备进入下一阶段？
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                当前阶段：{getStageName(project.currentStage)} → 下一阶段：{getStageName(getNextStage(project.currentStage)!)}
                            </p>
                        </div>
                        <button
                            onClick={onMoveToNextStage}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            进入下一阶段
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StageGateWorkflow;
