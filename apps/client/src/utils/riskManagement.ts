import type { Risk, RiskPriority, RiskCategory, RiskStatus, RiskMitigationAction, RiskHistoryEntry } from '../types';

/**
 * Calculate risk score (probability × impact)
 */
export const calculateRiskScore = (probability: number, impact: number): number => {
    return probability * impact;
};

/**
 * Determine risk priority based on risk score
 * Score ranges:
 * - Critical: 16-25 (High probability + High impact)
 * - High: 10-15
 * - Medium: 5-9
 * - Low: 1-4
 */
export const calculateRiskPriority = (riskScore: number): RiskPriority => {
    if (riskScore >= 16) return 'critical';
    if (riskScore >= 10) return 'high';
    if (riskScore >= 5) return 'medium';
    return 'low';
};

/**
 * Get risk priority color for UI display
 */
export const getRiskPriorityColor = (priority: RiskPriority): string => {
    const colors: Record<RiskPriority, string> = {
        critical: 'bg-red-500 text-white',
        high: 'bg-orange-500 text-white',
        medium: 'bg-yellow-500 text-white',
        low: 'bg-green-500 text-white',
    };
    return colors[priority];
};

/**
 * Get risk category display info
 */
export const getRiskCategoryInfo = (category: RiskCategory): { label: string; color: string; icon: string } => {
    const info: Record<RiskCategory, { label: string; color: string; icon: string }> = {
        schedule: { label: '进度风险', color: 'text-blue-600', icon: '📅' },
        cost: { label: '成本风险', color: 'text-green-600', icon: '💰' },
        resource: { label: '资源风险', color: 'text-purple-600', icon: '👥' },
        technical: { label: '技术风险', color: 'text-red-600', icon: '⚙️' },
        external: { label: '外部风险', color: 'text-orange-600', icon: '🌐' },
        quality: { label: '质量风险', color: 'text-pink-600', icon: '✨' },
        scope: { label: '范围风险', color: 'text-indigo-600', icon: '📊' },
    };
    return info[category];
};

/**
 * Get risk status display info
 */
export const getRiskStatusInfo = (status: RiskStatus): { label: string; color: string } => {
    const info: Record<RiskStatus, { label: string; color: string }> = {
        identified: { label: '已识别', color: 'bg-gray-100 text-gray-700' },
        analyzing: { label: '分析中', color: 'bg-blue-100 text-blue-700' },
        mitigating: { label: '缓解中', color: 'bg-yellow-100 text-yellow-700' },
        monitoring: { label: '监控中', color: 'bg-purple-100 text-purple-700' },
        resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
        accepted: { label: '已接受', color: 'bg-orange-100 text-orange-700' },
    };
    return info[status];
};

/**
 * Create a new risk with default values
 */
export const createRisk = (
    projectId: string,
    title: string,
    category: RiskCategory,
    probability: number,
    impact: number,
    owner: string,
    description: string = ''
): Risk => {
    const riskScore = calculateRiskScore(probability, impact);
    const priority = calculateRiskPriority(riskScore);
    const now = new Date().toISOString();

    return {
        id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        category,
        title,
        description,
        probability,
        impact,
        riskScore,
        priority,
        owner,
        status: 'identified',
        mitigationStrategy: '',
        mitigationActions: [],
        identifiedDate: now,
        history: [
            {
                id: `history-${Date.now()}`,
                date: now,
                userId: owner,
                userName: '当前用户',
                action: 'created',
                description: `创建风险: ${title}`,
            },
        ],
    };
};

/**
 * Update risk and add history entry
 */
export const updateRisk = (
    risk: Risk,
    updates: Partial<Risk>,
    userId: string,
    userName: string
): Risk => {
    const now = new Date().toISOString();
    const historyEntries: RiskHistoryEntry[] = [];

    // Track probability changes
    if (updates.probability !== undefined && updates.probability !== risk.probability) {
        historyEntries.push({
            id: `history-${Date.now()}-prob`,
            date: now,
            userId,
            userName,
            action: 'probability_changed',
            description: `概率从 ${risk.probability} 变更为 ${updates.probability}`,
            oldValue: risk.probability,
            newValue: updates.probability,
        });
    }

    // Track impact changes
    if (updates.impact !== undefined && updates.impact !== risk.impact) {
        historyEntries.push({
            id: `history-${Date.now()}-impact`,
            date: now,
            userId,
            userName,
            action: 'impact_changed',
            description: `影响从 ${risk.impact} 变更为 ${updates.impact}`,
            oldValue: risk.impact,
            newValue: updates.impact,
        });
    }

    // Track status changes
    if (updates.status && updates.status !== risk.status) {
        historyEntries.push({
            id: `history-${Date.now()}-status`,
            date: now,
            userId,
            userName,
            action: 'status_changed',
            description: `状态从 "${risk.status}" 变更为 "${updates.status}"`,
            oldValue: risk.status,
            newValue: updates.status,
        });
    }

    // Recalculate risk score and priority if probability or impact changed
    const newProbability = updates.probability ?? risk.probability;
    const newImpact = updates.impact ?? risk.impact;
    const newRiskScore = calculateRiskScore(newProbability, newImpact);
    const newPriority = calculateRiskPriority(newRiskScore);

    return {
        ...risk,
        ...updates,
        probability: newProbability,
        impact: newImpact,
        riskScore: newRiskScore,
        priority: newPriority,
        lastReviewDate: now,
        history: [...risk.history, ...historyEntries],
    };
};

/**
 * Add mitigation action to risk
 */
export const addMitigationAction = (
    risk: Risk,
    action: Omit<RiskMitigationAction, 'id'>,
    userId: string,
    userName: string
): Risk => {
    const now = new Date().toISOString();
    const newAction: RiskMitigationAction = {
        ...action,
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    return {
        ...risk,
        mitigationActions: [...risk.mitigationActions, newAction],
        history: [
            ...risk.history,
            {
                id: `history-${Date.now()}`,
                date: now,
                userId,
                userName,
                action: 'mitigation_added',
                description: `添加缓解措施: ${action.description}`,
            },
        ],
    };
};

/**
 * Update mitigation action status
 */
export const updateMitigationAction = (
    risk: Risk,
    actionId: string,
    updates: Partial<RiskMitigationAction>
): Risk => {
    return {
        ...risk,
        mitigationActions: risk.mitigationActions.map((action) =>
            action.id === actionId
                ? {
                    ...action,
                    ...updates,
                    completedDate: updates.status === 'completed' ? new Date().toISOString() : action.completedDate,
                }
                : action
        ),
    };
};

/**
 * Calculate overall project risk score
 */
export const calculateProjectRiskScore = (risks: Risk[]): number => {
    if (risks.length === 0) return 0;

    // Filter out resolved and accepted risks
    const activeRisks = risks.filter((r) => r.status !== 'resolved' && r.status !== 'accepted');

    if (activeRisks.length === 0) return 0;

    // Calculate weighted average based on priority
    const weights: Record<RiskPriority, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
    };

    const totalWeightedScore = activeRisks.reduce((sum, risk) => {
        return sum + risk.riskScore * weights[risk.priority];
    }, 0);

    const totalWeight = activeRisks.reduce((sum, risk) => {
        return sum + weights[risk.priority];
    }, 0);

    return Math.round((totalWeightedScore / totalWeight) * 10) / 10;
};

/**
 * Get risk distribution by category
 */
export const getRiskDistribution = (risks: Risk[]): Record<RiskCategory, number> => {
    const distribution: Record<RiskCategory, number> = {
        schedule: 0,
        cost: 0,
        resource: 0,
        technical: 0,
        external: 0,
        quality: 0,
        scope: 0,
    };

    risks.forEach((risk) => {
        distribution[risk.category]++;
    });

    return distribution;
};

/**
 * Get risk distribution by priority
 */
export const getRiskPriorityDistribution = (risks: Risk[]): Record<RiskPriority, number> => {
    const distribution: Record<RiskPriority, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
    };

    risks.forEach((risk) => {
        distribution[risk.priority]++;
    });

    return distribution;
};

/**
 * Get top risks by score
 */
export const getTopRisks = (risks: Risk[], limit: number = 5): Risk[] => {
    return [...risks]
        .filter((r) => r.status !== 'resolved' && r.status !== 'accepted')
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, limit);
};

/**
 * Check if risk needs review (based on nextReviewDate)
 */
export const needsReview = (risk: Risk): boolean => {
    if (!risk.nextReviewDate) return false;
    return new Date(risk.nextReviewDate) <= new Date();
};

/**
 * Get risks that need review
 */
export const getRisksNeedingReview = (risks: Risk[]): Risk[] => {
    return risks.filter((r) => needsReview(r) && r.status !== 'resolved');
};
