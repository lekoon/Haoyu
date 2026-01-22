import type { ApprovalWorkflow, ApprovalStep, ApprovalType } from '../types';

/**
 * 审批流配置模板
 */
export const APPROVAL_TEMPLATES: Record<
    ApprovalType,
    {
        name: string;
        description: string;
        defaultApprovers: Omit<ApprovalStep, 'decidedAt'>[];
    }
> = {
    project_initiation: {
        name: '项目立项审批',
        description: '新项目启动需要经过多级审批',
        defaultApprovers: [
            {
                stepNumber: 1,
                approverId: 'pm-lead',
                approverName: 'PMO 负责人',
                approverRole: 'PMO Lead',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
            {
                stepNumber: 2,
                approverId: 'finance',
                approverName: '财务总监',
                approverRole: 'CFO',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
            {
                stepNumber: 3,
                approverId: 'ceo',
                approverName: 'CEO',
                approverRole: 'CEO',
                status: 'pending',
                isRequired: false,
                canSkip: true,
            },
        ],
    },
    project_closure: {
        name: '项目结项审批',
        description: '项目完成后的验收审批',
        defaultApprovers: [
            {
                stepNumber: 1,
                approverId: 'qa-lead',
                approverName: 'QA 负责人',
                approverRole: 'QA Lead',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
            {
                stepNumber: 2,
                approverId: 'pm-lead',
                approverName: 'PMO 负责人',
                approverRole: 'PMO Lead',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
        ],
    },
    budget_change: {
        name: '预算变更审批',
        description: '预算超支 10% 以上需要审批',
        defaultApprovers: [
            {
                stepNumber: 1,
                approverId: 'pm-lead',
                approverName: 'PMO 负责人',
                approverRole: 'PMO Lead',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
            {
                stepNumber: 2,
                approverId: 'finance',
                approverName: '财务总监',
                approverRole: 'CFO',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
        ],
    },
    resource_request: {
        name: '资源申请审批',
        description: '关键资源申请需要审批',
        defaultApprovers: [
            {
                stepNumber: 1,
                approverId: 'resource-manager',
                approverName: '资源经理',
                approverRole: 'Resource Manager',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
            {
                stepNumber: 2,
                approverId: 'pm-lead',
                approverName: 'PMO 负责人',
                approverRole: 'PMO Lead',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
        ],
    },
    change_request: {
        name: '变更请求审批',
        description: '重大变更需要审批',
        defaultApprovers: [
            {
                stepNumber: 1,
                approverId: 'tech-lead',
                approverName: '技术负责人',
                approverRole: 'Tech Lead',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
            {
                stepNumber: 2,
                approverId: 'pm-lead',
                approverName: 'PMO 负责人',
                approverRole: 'PMO Lead',
                status: 'pending',
                isRequired: true,
                canSkip: false,
            },
        ],
    },
};

/**
 * 创建审批流实例
 */
export function createApprovalWorkflow(
    type: ApprovalType,
    entityId: string,
    entityName: string,
    requestedBy: string,
    requestedByName: string,
    customApprovers?: Omit<ApprovalStep, 'status' | 'decidedAt'>[]
): Omit<ApprovalWorkflow, 'id' | 'createdAt'> {
    const template = APPROVAL_TEMPLATES[type];
    const approvers = customApprovers || template.defaultApprovers;

    return {
        type,
        entityId,
        entityName,
        requestedBy,
        requestedByName,
        requestDate: new Date().toISOString(),
        approvers: approvers.map((a) => ({
            ...a,
            status: 'pending' as const,
        })),
        currentStepIndex: 0,
        overallStatus: 'pending',
    };
}

/**
 * 检查是否需要触发审批流
 */
export function shouldTriggerApproval(
    type: ApprovalType,
    context: {
        budgetChange?: number;
        originalBudget?: number;
        resourcePriority?: string;
        changeImpact?: 'low' | 'medium' | 'high' | 'critical';
    }
): boolean {
    switch (type) {
        case 'budget_change':
            if (context.budgetChange && context.originalBudget) {
                const changePercentage = (context.budgetChange / context.originalBudget) * 100;
                return Math.abs(changePercentage) > 10; // 超过 10% 需要审批
            }
            return false;

        case 'resource_request':
            return context.resourcePriority === 'P0' || context.resourcePriority === 'P1';

        case 'change_request':
            return context.changeImpact === 'high' || context.changeImpact === 'critical';

        case 'project_initiation':
        case 'project_closure':
            return true; // 总是需要审批

        default:
            return false;
    }
}

/**
 * 获取下一个待审批步骤
 */
export function getNextPendingStep(workflow: ApprovalWorkflow): ApprovalStep | null {
    return (
        workflow.approvers.find(
            (step) => step.status === 'pending' && step.isRequired
        ) || null
    );
}

/**
 * 检查审批流是否可以继续
 */
export function canProceedToNextStep(workflow: ApprovalWorkflow, currentStepNumber: number): boolean {
    const currentStep = workflow.approvers.find((s) => s.stepNumber === currentStepNumber);
    if (!currentStep) return false;

    // 如果当前步骤被拒绝，不能继续
    if (currentStep.status === 'rejected') return false;

    // 如果当前步骤是必需的且未批准，不能继续
    if (currentStep.isRequired && currentStep.status !== 'approved') return false;

    return true;
}

/**
 * 计算审批流的整体状态
 */
export function calculateOverallStatus(approvers: ApprovalStep[]): 'pending' | 'approved' | 'rejected' | 'cancelled' {
    // 如果有任何必需步骤被拒绝，整体状态为拒绝
    const hasRejection = approvers.some((a) => a.isRequired && a.status === 'rejected');
    if (hasRejection) return 'rejected';

    // 如果所有必需步骤都已批准，整体状态为批准
    const allRequiredApproved = approvers
        .filter((a) => a.isRequired)
        .every((a) => a.status === 'approved');
    if (allRequiredApproved) return 'approved';

    // 否则为待审批
    return 'pending';
}

/**
 * 生成审批流摘要
 */
export function generateApprovalSummary(workflow: ApprovalWorkflow): string {
    const template = APPROVAL_TEMPLATES[workflow.type];
    const totalSteps = workflow.approvers.filter((a) => a.isRequired).length;
    const approvedSteps = workflow.approvers.filter(
        (a) => a.isRequired && a.status === 'approved'
    ).length;

    let summary = `${template.name}\n`;
    summary += `实体：${workflow.entityName}\n`;
    summary += `申请人：${workflow.requestedByName}\n`;
    summary += `进度：${approvedSteps}/${totalSteps} 步骤已批准\n`;
    summary += `状态：${workflow.overallStatus}\n\n`;

    summary += '审批步骤：\n';
    workflow.approvers.forEach((step) => {
        const statusIcon =
            step.status === 'approved'
                ? '✓'
                : step.status === 'rejected'
                    ? '✗'
                    : '○';
        summary += `${statusIcon} 步骤 ${step.stepNumber}: ${step.approverName} (${step.approverRole})`;
        if (step.status !== 'pending') {
            summary += ` - ${step.status}`;
            if (step.decidedAt) {
                summary += ` at ${new Date(step.decidedAt).toLocaleString()}`;
            }
        }
        summary += '\n';
        if (step.comments) {
            summary += `   备注：${step.comments}\n`;
        }
    });

    return summary;
}
