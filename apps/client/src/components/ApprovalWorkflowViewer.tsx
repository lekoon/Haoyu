import React from 'react';
import { CheckCircle, XCircle, Clock, User, MessageSquare } from 'lucide-react';
import type { ApprovalWorkflow } from '../types';
import { Card, Badge, Button } from './ui';
import { APPROVAL_TEMPLATES } from '../utils/approvalEngine';

interface ApprovalWorkflowViewerProps {
    workflow: ApprovalWorkflow;
    onApprove?: (stepNumber: number, comments?: string) => void;
    onReject?: (stepNumber: number, comments: string) => void;
    currentUserId?: string;
    canApprove?: boolean;
}

export const ApprovalWorkflowViewer: React.FC<ApprovalWorkflowViewerProps> = ({
    workflow,
    onApprove,
    onReject,
    currentUserId,
    canApprove = false,
}) => {
    const template = APPROVAL_TEMPLATES[workflow.type];
    const [commentInput, setCommentInput] = React.useState<Record<number, string>>({});

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            case 'rejected':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            default:
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
        }
    };

    const currentStep = workflow.approvers.find((s) => s.status === 'pending' && s.isRequired);
    const canCurrentUserApprove =
        canApprove && currentStep && currentStep.approverId === currentUserId;

    return (
        <div className="space-y-4">
            {/* 工作流头部 */}
            <Card className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {template.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {workflow.entityName}
                        </p>
                    </div>
                    <Badge
                        variant={
                            workflow.overallStatus === 'approved'
                                ? 'success'
                                : workflow.overallStatus === 'rejected'
                                    ? 'danger'
                                    : 'warning'
                        }
                    >
                        {workflow.overallStatus}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-600 dark:text-slate-400">申请人:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                            {workflow.requestedByName}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-600 dark:text-slate-400">申请时间:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                            {new Date(workflow.requestDate).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* 进度条 */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span>审批进度</span>
                        <span>
                            {workflow.approvers.filter((a) => a.status === 'approved').length} /{' '}
                            {workflow.approvers.filter((a) => a.isRequired).length}
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                                width: `${(workflow.approvers.filter((a) => a.status === 'approved')
                                        .length /
                                        workflow.approvers.filter((a) => a.isRequired).length) *
                                    100
                                    }%`,
                            }}
                        />
                    </div>
                </div>
            </Card>

            {/* 审批步骤 */}
            <div className="space-y-3">
                {workflow.approvers.map((step, index) => {
                    const isCurrentStep = step === currentStep;
                    const canApproveThis = canCurrentUserApprove && isCurrentStep;

                    return (
                        <Card
                            key={step.stepNumber}
                            className={`p-4 ${getStatusColor(step.status)} ${isCurrentStep ? 'ring-2 ring-blue-500' : ''
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* 步骤图标 */}
                                <div className="flex-shrink-0 mt-1">{getStatusIcon(step.status)}</div>

                                {/* 步骤内容 */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                步骤 {step.stepNumber}
                                            </span>
                                            {step.isRequired && (
                                                <Badge variant="danger" size="sm">
                                                    必需
                                                </Badge>
                                            )}
                                        </div>
                                        {isCurrentStep && (
                                            <Badge variant="primary" size="sm">
                                                当前步骤
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-900 dark:text-slate-100">
                                            {step.approverName}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            ({step.approverRole})
                                        </span>
                                    </div>

                                    {step.decidedAt && (
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                            决策时间: {new Date(step.decidedAt).toLocaleString()}
                                        </p>
                                    )}

                                    {step.comments && (
                                        <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded">
                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                                    {step.comments}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 审批操作 */}
                                    {canApproveThis && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                            <textarea
                                                value={commentInput[step.stepNumber] || ''}
                                                onChange={(e) =>
                                                    setCommentInput({
                                                        ...commentInput,
                                                        [step.stepNumber]: e.target.value,
                                                    })
                                                }
                                                placeholder="添加审批意见（可选）"
                                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg mb-2 dark:bg-slate-800"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() =>
                                                        onApprove?.(
                                                            step.stepNumber,
                                                            commentInput[step.stepNumber]
                                                        )
                                                    }
                                                    variant="success"
                                                    size="sm"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    批准
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        const comment = commentInput[step.stepNumber];
                                                        if (comment) {
                                                            onReject?.(step.stepNumber, comment);
                                                        } else {
                                                            alert('拒绝时必须填写理由');
                                                        }
                                                    }}
                                                    variant="danger"
                                                    size="sm"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    拒绝
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ApprovalWorkflowViewer;
