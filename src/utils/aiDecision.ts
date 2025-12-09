import type { Project, ResourcePoolItem, FactorDefinition } from '../types';

/**
 * AI 辅助决策引擎
 * 提供智能推荐、风险预测和优化建议
 */

// 项目优先级智能推荐
export interface PriorityRecommendation {
    projectId: string;
    projectName: string;
    currentPriority: string;
    recommendedPriority: 'P0' | 'P1' | 'P2' | 'P3';
    confidence: number; // 0-100
    reasons: string[];
    impact: 'high' | 'medium' | 'low';
}

// 资源分配优化建议
export interface ResourceOptimization {
    type: 'reallocation' | 'hiring' | 'training' | 'outsourcing';
    priority: 'urgent' | 'high' | 'medium' | 'low';
    description: string;
    affectedProjects: string[];
    estimatedImpact: {
        costSaving?: number;
        timeReduction?: number;
        qualityImprovement?: number;
    };
    actionItems: string[];
}

// 风险预测
export interface RiskPrediction {
    projectId: string;
    projectName: string;
    riskType: 'resource' | 'timeline' | 'budget' | 'quality';
    severity: 'critical' | 'high' | 'medium' | 'low';
    probability: number; // 0-100
    description: string;
    mitigation: string[];
    predictedDate?: string;
}

/**
 * 分析项目优先级并提供智能推荐
 */
export const analyzePriorityRecommendations = (
    projects: Project[],
    _factorDefinitions: FactorDefinition[]
): PriorityRecommendation[] => {
    const recommendations: PriorityRecommendation[] = [];

    projects.forEach(project => {
        const reasons: string[] = [];
        let recommendedPriority: 'P0' | 'P1' | 'P2' | 'P3' = project.priority || 'P2';
        let confidence = 70;

        // 基于评分分析
        const score = project.score || 0;
        if (score >= 8.5) {
            recommendedPriority = 'P0';
            reasons.push(`高评分项目 (${score.toFixed(1)})，建议最高优先级`);
            confidence = 90;
        } else if (score >= 7.0) {
            recommendedPriority = 'P1';
            reasons.push(`良好评分 (${score.toFixed(1)})，建议高优先级`);
            confidence = 85;
        } else if (score >= 5.0) {
            recommendedPriority = 'P2';
            reasons.push(`中等评分 (${score.toFixed(1)})，建议中等优先级`);
            confidence = 75;
        } else {
            recommendedPriority = 'P3';
            reasons.push(`较低评分 (${score.toFixed(1)})，建议低优先级`);
            confidence = 80;
        }

        // 基于资源需求分析
        const totalResources = (project.resourceRequirements || []).reduce((sum, req) => sum + req.count, 0);
        if (totalResources > 10) {
            reasons.push('需要大量资源投入，需要优先保障');
            if (recommendedPriority === 'P2' || recommendedPriority === 'P3') {
                recommendedPriority = 'P1';
            }
        }

        // 基于时间紧迫性
        if (project.startDate && project.endDate) {
            const start = new Date(project.startDate);
            const end = new Date(project.endDate);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

            if (duration < 30) {
                reasons.push('项目周期短，需要快速推进');
                confidence += 5;
            }

            const today = new Date();
            const daysUntilStart = (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            if (daysUntilStart < 7 && daysUntilStart > 0) {
                reasons.push('即将开始，需要优先准备');
                if (recommendedPriority === 'P3') {
                    recommendedPriority = 'P2';
                }
            }
        }

        // 基于状态分析
        if (project.status === 'active') {
            reasons.push('项目已启动，需要持续关注');
            confidence += 5;
        }

        // 只在推荐优先级与当前不同时添加建议
        if (recommendedPriority !== project.priority) {
            recommendations.push({
                projectId: project.id,
                projectName: project.name,
                currentPriority: project.priority || 'P2',
                recommendedPriority,
                confidence: Math.min(confidence, 95),
                reasons,
                impact: recommendedPriority === 'P0' ? 'high' : recommendedPriority === 'P1' ? 'medium' : 'low'
            });
        }
    });

    return recommendations.sort((a, b) => b.confidence - a.confidence);
};

/**
 * 生成资源优化建议
 */
export const generateResourceOptimizations = (
    projects: Project[],
    resources: ResourcePoolItem[]
): ResourceOptimization[] => {
    const optimizations: ResourceOptimization[] = [];

    // 分析资源利用率
    const resourceUtilization = new Map<string, number>();
    resources.forEach(resource => {
        let totalAllocated = 0;
        projects.forEach(project => {
            (project.resourceRequirements || []).forEach(req => {
                if (req.resourceId === resource.id) {
                    totalAllocated += req.count;
                }
            });
        });
        resourceUtilization.set(resource.id, totalAllocated / resource.totalQuantity);
    });

    // 识别过度分配的资源
    resourceUtilization.forEach((utilization, resourceId) => {
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) return;

        if (utilization > 1.2) {
            const affectedProjects = projects
                .filter(p => (p.resourceRequirements || []).some(req => req.resourceId === resourceId))
                .map(p => p.name);

            optimizations.push({
                type: 'hiring',
                priority: 'urgent',
                description: `${resource.name} 严重超载 (${(utilization * 100).toFixed(0)}%)`,
                affectedProjects,
                estimatedImpact: {
                    timeReduction: 30,
                    qualityImprovement: 25
                },
                actionItems: [
                    `立即招聘 ${Math.ceil((utilization - 1) * resource.totalQuantity)} 名 ${resource.name}`,
                    '考虑外包部分工作以缓解压力',
                    '重新评估项目优先级，延后低优先级项目'
                ]
            });
        } else if (utilization < 0.5) {
            optimizations.push({
                type: 'reallocation',
                priority: 'medium',
                description: `${resource.name} 利用率较低 (${(utilization * 100).toFixed(0)}%)`,
                affectedProjects: [],
                estimatedImpact: {
                    costSaving: resource.costPerUnit ? resource.costPerUnit * resource.totalQuantity * 0.3 : 0
                },
                actionItems: [
                    '考虑将闲置资源分配到其他项目',
                    '评估是否可以减少该资源的容量',
                    '寻找新的项目机会以提高利用率'
                ]
            });
        }
    });

    // 技能缺口分析
    const skillGaps = new Map<string, number>();
    projects.forEach(project => {
        (project.resourceRequirements || []).forEach(req => {
            if (req.requiredSkills) {
                req.requiredSkills.forEach(skill => {
                    skillGaps.set(skill, (skillGaps.get(skill) || 0) + 1);
                });
            }
        });
    });

    // 识别关键技能缺口
    skillGaps.forEach((count, skill) => {
        if (count >= 3) {
            optimizations.push({
                type: 'training',
                priority: 'high',
                description: `${skill} 技能需求量大 (${count} 个项目需要)`,
                affectedProjects: [],
                estimatedImpact: {
                    qualityImprovement: 20,
                    timeReduction: 15
                },
                actionItems: [
                    `组织 ${skill} 技能培训`,
                    '招聘具备该技能的专业人员',
                    '建立技能认证体系'
                ]
            });
        }
    });

    return optimizations.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
};

/**
 * 预测项目风险
 */
export const predictProjectRisks = (
    projects: Project[],
    _resources: ResourcePoolItem[]
): RiskPrediction[] => {
    const risks: RiskPrediction[] = [];

    projects.forEach(project => {
        // 资源风险
        const totalRequired = (project.resourceRequirements || []).reduce((sum, req) => sum + req.count, 0);
        if (totalRequired > 15) {
            risks.push({
                projectId: project.id,
                projectName: project.name,
                riskType: 'resource',
                severity: 'high',
                probability: 75,
                description: `项目需要 ${totalRequired} 个资源，可能面临资源短缺`,
                mitigation: [
                    '提前锁定关键资源',
                    '建立资源储备池',
                    '制定应急资源方案'
                ]
            });
        }

        // 时间风险
        if (project.startDate && project.endDate) {
            const start = new Date(project.startDate);
            const end = new Date(project.endDate);
            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

            if (duration < 30 && totalRequired > 5) {
                risks.push({
                    projectId: project.id,
                    projectName: project.name,
                    riskType: 'timeline',
                    severity: 'critical',
                    probability: 85,
                    description: `项目周期仅 ${Math.round(duration)} 天，但需要 ${totalRequired} 个资源`,
                    mitigation: [
                        '增加资源投入以加快进度',
                        '简化项目范围',
                        '采用敏捷开发方法',
                        '设置关键里程碑检查点'
                    ],
                    predictedDate: project.endDate
                });
            }
        }

        // 预算风险（如果有成本信息）
        if (project.estimatedCost && project.estimatedCost > 1000000) {
            risks.push({
                projectId: project.id,
                projectName: project.name,
                riskType: 'budget',
                severity: 'high',
                probability: 60,
                description: `项目预算较高 (¥${(project.estimatedCost / 10000).toFixed(0)}万)，需要严格成本控制`,
                mitigation: [
                    '建立详细的成本跟踪机制',
                    '设置预算预警阈值',
                    '定期进行成本审查',
                    '优化资源配置以降低成本'
                ]
            });
        }

        // 质量风险
        if ((project.score || 0) < 6.0 && project.status === 'active') {
            risks.push({
                projectId: project.id,
                projectName: project.name,
                riskType: 'quality',
                severity: 'medium',
                probability: 70,
                description: `项目评分较低 (${(project.score || 0).toFixed(1)})，可能影响交付质量`,
                mitigation: [
                    '加强质量管理流程',
                    '增加测试和审查环节',
                    '引入质量保证专家',
                    '提高团队技能水平'
                ]
            });
        }
    });

    return risks.sort((a, b) => {
        const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
};

/**
 * 生成智能决策摘要
 */
export interface DecisionSummary {
    totalProjects: number;
    highPriorityCount: number;
    resourceUtilization: number;
    topRecommendations: string[];
    criticalRisks: number;
    optimizationOpportunities: number;
}

export const generateDecisionSummary = (
    projects: Project[],
    resources: ResourcePoolItem[]
): DecisionSummary => {
    const recommendations = analyzePriorityRecommendations(projects, []);
    const optimizations = generateResourceOptimizations(projects, resources);
    const risks = predictProjectRisks(projects, resources);

    const highPriorityCount = projects.filter(p => p.priority === 'P0' || p.priority === 'P1').length;

    // 计算平均资源利用率
    let totalUtilization = 0;
    resources.forEach(resource => {
        let allocated = 0;
        projects.forEach(project => {
            (project.resourceRequirements || []).forEach(req => {
                if (req.resourceId === resource.id) {
                    allocated += req.count;
                }
            });
        });
        totalUtilization += allocated / resource.totalQuantity;
    });
    const avgUtilization = resources.length > 0 ? totalUtilization / resources.length : 0;

    const topRecommendations: string[] = [];
    if (recommendations.length > 0) {
        topRecommendations.push(`${recommendations.length} 个项目需要调整优先级`);
    }
    if (optimizations.filter(o => o.priority === 'urgent').length > 0) {
        topRecommendations.push(`${optimizations.filter(o => o.priority === 'urgent').length} 个紧急优化建议`);
    }
    if (risks.filter(r => r.severity === 'critical').length > 0) {
        topRecommendations.push(`${risks.filter(r => r.severity === 'critical').length} 个关键风险需要关注`);
    }

    return {
        totalProjects: projects.length,
        highPriorityCount,
        resourceUtilization: avgUtilization * 100,
        topRecommendations,
        criticalRisks: risks.filter(r => r.severity === 'critical' || r.severity === 'high').length,
        optimizationOpportunities: optimizations.length
    };
};
