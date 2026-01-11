import type { ProjectStage, StageGate, GateStatus } from '../types';

/**
 * Default stage-gate templates for different project types
 */
export const DEFAULT_STAGE_GATES: Record<string, StageGate[]> = {
    standard: [
        {
            id: 'gate-1',
            stage: 'initiation',
            name: 'Gate 1: 项目启动审批',
            description: '项目章程和初步范围定义',
            requirements: [
                {
                    id: 'req-1-1',
                    description: '项目章程已编制',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-1-2',
                    description: '干系人已识别',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-1-3',
                    description: '初步预算已批准',
                    required: true,
                    completed: false
                }
            ],
            status: 'pending'
        },
        {
            id: 'gate-2',
            stage: 'planning',
            name: 'Gate 2: 计划审批',
            description: '详细项目计划和资源分配',
            requirements: [
                {
                    id: 'req-2-1',
                    description: '项目计划已完成',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-2-2',
                    description: '风险评估已完成',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-2-3',
                    description: '资源已分配',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-2-4',
                    description: '质量标准已定义',
                    required: false,
                    completed: false
                }
            ],
            status: 'pending'
        },
        {
            id: 'gate-3',
            stage: 'execution',
            name: 'Gate 3: 执行审批',
            description: '开始项目执行',
            requirements: [
                {
                    id: 'req-3-1',
                    description: '团队已组建',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-3-2',
                    description: '启动会议已召开',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-3-3',
                    description: '基线已建立',
                    required: true,
                    completed: false
                }
            ],
            status: 'pending'
        },
        {
            id: 'gate-4',
            stage: 'monitoring',
            name: 'Gate 4: 监控审批',
            description: '项目进度和质量监控',
            requirements: [
                {
                    id: 'req-4-1',
                    description: '进度报告机制已建立',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-4-2',
                    description: '变更控制流程已实施',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-4-3',
                    description: '质量检查点已设置',
                    required: false,
                    completed: false
                }
            ],
            status: 'pending'
        },
        {
            id: 'gate-5',
            stage: 'closing',
            name: 'Gate 5: 项目收尾',
            description: '项目验收和总结',
            requirements: [
                {
                    id: 'req-5-1',
                    description: '所有交付物已完成',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-5-2',
                    description: '客户验收已获得',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-5-3',
                    description: '经验教训已总结',
                    required: true,
                    completed: false
                },
                {
                    id: 'req-5-4',
                    description: '项目文档已归档',
                    required: false,
                    completed: false
                }
            ],
            status: 'pending'
        }
    ]
};

/**
 * Get stage name in Chinese
 */
export function getStageName(stage: ProjectStage): string {
    const names: Record<ProjectStage, string> = {
        initiation: '启动',
        planning: '计划',
        execution: '执行',
        monitoring: '监控',
        closing: '收尾'
    };
    return names[stage];
}

/**
 * Get next stage
 */
export function getNextStage(currentStage: ProjectStage): ProjectStage | null {
    const stages: ProjectStage[] = ['initiation', 'planning', 'execution', 'monitoring', 'closing'];
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex < stages.length - 1) {
        return stages[currentIndex + 1];
    }
    return null;
}

/**
 * Check if gate can be approved
 */
export function canApproveGate(gate: StageGate): boolean {
    const requiredRequirements = gate.requirements.filter(r => r.required);
    return requiredRequirements.every(r => r.completed);
}

/**
 * Get gate completion percentage
 */
export function getGateCompletionPercentage(gate: StageGate): number {
    const totalRequirements = gate.requirements.length;
    if (totalRequirements === 0) return 100;

    const completedRequirements = gate.requirements.filter(r => r.completed).length;
    return Math.round((completedRequirements / totalRequirements) * 100);
}

/**
 * Get gate status color
 */
export function getGateStatusColor(status: GateStatus): string {
    const colors: Record<GateStatus, string> = {
        pending: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-700',
        requested: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
        approved: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
        rejected: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
        conditional: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20'
    };
    return colors[status];
}

/**
 * Get gate status label
 */
export function getGateStatusLabel(status: GateStatus): string {
    const labels: Record<GateStatus, string> = {
        pending: '待申请',
        requested: '申请中',
        approved: '已批准',
        rejected: '已拒绝',
        conditional: '有条件批准'
    };
    return labels[status];
}

/**
 * Approve gate
 */
export function approveGate(
    gate: StageGate,
    userId: string,
    userName: string,
    comments?: string,
    conditions?: string[]
): StageGate {
    return {
        ...gate,
        status: conditions && conditions.length > 0 ? 'conditional' : 'approved',
        approvedBy: userId,
        approvedByName: userName,
        approvalDate: new Date().toISOString(),
        comments,
        conditions
    };
}

/**
 * Request gate approval
 */
export function requestGate(gate: StageGate): StageGate {
    return {
        ...gate,
        status: 'requested'
    };
}

/**
 * Reject gate
 */
export function rejectGate(
    gate: StageGate,
    userId: string,
    userName: string,
    comments: string
): StageGate {
    return {
        ...gate,
        status: 'rejected',
        approvedBy: userId,
        approvedByName: userName,
        approvalDate: new Date().toISOString(),
        comments
    };
}

/**
 * Update requirement completion
 */
export function updateRequirement(
    gate: StageGate,
    requirementId: string,
    completed: boolean,
    userId?: string,
    evidence?: string
): StageGate {
    return {
        ...gate,
        requirements: gate.requirements.map(req =>
            req.id === requirementId
                ? {
                    ...req,
                    completed,
                    completedDate: completed ? new Date().toISOString() : undefined,
                    completedBy: completed ? userId : undefined,
                    evidence: completed ? evidence : undefined
                }
                : req
        )
    };
}
