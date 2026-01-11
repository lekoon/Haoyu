import React from 'react';
import {
    X, CheckCircle, XCircle, Clock, FileText,
    AlertTriangle, DollarSign, TrendingUp, User,
    ShieldCheck
} from 'lucide-react';
import type { ChangeRequest } from '../types';
import { Card, Badge } from './ui';

interface ChangeRequestDetailModalProps {
    request: ChangeRequest;
    onClose: () => void;
    onApprove: (id: string, comment: string) => void;
    onReject: (id: string, reason: string) => void;
    isPMO: boolean;
}

const ChangeRequestDetailModal: React.FC<ChangeRequestDetailModalProps> = ({
    request,
    onClose,
    onApprove,
    onReject,
    isPMO
}) => {
    const [comment, setComment] = React.useState('');
    const isPending = request.status === 'pending';
    const isStageGate = request.category === 'project_status' && request.metadata?.type === 'stage_gate';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl rounded-[32px] overflow-hidden">
                <div className={`p-6 flex justify-between items-center ${isStageGate ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white ${isStageGate ? 'bg-indigo-600 shadow-indigo-500/30' : 'bg-blue-600 shadow-blue-500/30'
                            }`}>
                            {isStageGate ? <ShieldCheck size={24} /> : <FileText size={24} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{request.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="neutral" size="sm">{request.projectName}</Badge>
                                <Badge variant={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                                    {request.status === 'pending' ? '待审批' : request.status === 'approved' ? '已批准' : '已拒绝'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Summary Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">申请人</div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                                <User size={14} className="text-slate-400" />
                                {request.requestedByName || request.requestedBy}
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">申请日期</div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                                <Clock size={14} className="text-slate-400" />
                                {new Date(request.requestDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">变更类型</div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                                <Badge variant="neutral" size="sm">{request.category === 'project_status' ? '项目状态' : request.category}</Badge>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">影响等级</div>
                            <div className={`flex items-center gap-2 text-sm font-bold ${request.impactLevel === 'critical' || request.impactLevel === 'high' ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                <AlertTriangle size={14} />
                                {request.impactLevel.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">变更详情</h4>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {request.description}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">变更理由</h4>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                {request.businessJustification}
                            </div>
                        </div>

                        {/* Impact Metrics */}
                        {!isStageGate && (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                        <Clock size={16} />
                                        <span className="text-xs font-bold uppercase">工时增加</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{request.estimatedEffortHours} hr</div>
                                </div>
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                                        <DollarSign size={16} />
                                        <span className="text-xs font-bold uppercase">预算影响</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">¥{request.estimatedCostIncrease.toLocaleString()}</div>
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                                        <TrendingUp size={16} />
                                        <span className="text-xs font-bold uppercase">进度偏差</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">+{request.scheduleImpactDays} d</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Handling Section */}
                    {isPending && isPMO && (
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-indigo-600" />
                                PMO 审批决策
                            </h4>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-indigo-100 outline-none transition-all mb-4"
                                placeholder="请输入审批意见或拒绝原因..."
                                rows={3}
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => onApprove(request.id, comment)}
                                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} />
                                    核准变更
                                </button>
                                <button
                                    onClick={() => onReject(request.id, comment)}
                                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <XCircle size={20} />
                                    拒绝请求
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Audit Trail */}
                    {!isPending && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase">审批结果</h4>
                                <div className="text-xs text-slate-400">{new Date(request.approvalDate!).toLocaleString()}</div>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                                {request.status === 'approved' ? (
                                    <CheckCircle size={16} className="text-emerald-500" />
                                ) : (
                                    <XCircle size={16} className="text-red-500" />
                                )}
                                {request.approvedByName}
                            </div>
                            {(request.rejectionReason || request.metadata?.approvalComment) && (
                                <div className="text-sm text-slate-600 dark:text-slate-400 italic">
                                    "{request.rejectionReason || request.metadata?.approvalComment}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ChangeRequestDetailModal;
