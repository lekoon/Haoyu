import { Project, Risk, Task, RiskCategory } from '../types';
import { RISK_TEMPLATES, RiskTemplate } from './riskTemplates';

/**
 * AI-powered risk identification based on project characteristics
 */

interface RiskSuggestion {
    template: RiskTemplate;
    confidence: number; // 0-1
    reason: string;
    relatedFactors: string[];
}

/**
 * Analyze project and suggest potential risks using AI-like heuristics
 */
export const suggestRisks = (project: Project, allProjects: Project[]): RiskSuggestion[] => {
    const suggestions: RiskSuggestion[] = [];

    // 1. Schedule Risk Analysis
    const scheduleRisks = analyzeScheduleRisks(project);
    suggestions.push(...scheduleRisks);

    // 2. Cost Risk Analysis
    const costRisks = analyzeCostRisks(project);
    suggestions.push(...costRisks);

    // 3. Resource Risk Analysis
    const resourceRisks = analyzeResourceRisks(project);
    suggestions.push(...resourceRisks);

    // 4. Technical Risk Analysis
    const technicalRisks = analyzeTechnicalRisks(project);
    suggestions.push(...technicalRisks);

    // 5. Quality Risk Analysis
    const qualityRisks = analyzeQualityRisks(project);
    suggestions.push(...qualityRisks);

    // 6. Scope Risk Analysis
    const scopeRisks = analyzeScopeRisks(project);
    suggestions.push(...scopeRisks);

    // 7. Historical Pattern Analysis
    const historicalRisks = analyzeHistoricalPatterns(project, allProjects);
    suggestions.push(...historicalRisks);

    // Sort by confidence and remove duplicates
    return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .filter((suggestion, index, self) =>
            index === self.findIndex((s) => s.template.id === suggestion.template.id)
        )
        .slice(0, 10); // Top 10 suggestions
};

/**
 * Analyze schedule-related risks
 */
const analyzeScheduleRisks = (project: Project): RiskSuggestion[] => {
    const suggestions: RiskSuggestion[] = [];
    const tasks = project.tasks || [];
    const milestones = project.milestones || [];

    // Check for tight deadlines
    const projectDuration = new Date(project.endDate).getTime() - new Date(project.startDate).getTime();
    const daysRemaining = projectDuration / (1000 * 60 * 60 * 24);

    if (daysRemaining < 90 && tasks.length > 20) {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-schedule-001');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.85,
                reason: '项目工期紧张（少于90天）且任务数量较多（>20个），存在里程碑延期风险',
                relatedFactors: ['工期', '任务数量'],
            });
        }
    }

    // Check for dependency risks
    const tasksWithDependencies = tasks.filter((t) => t.dependencies && t.dependencies.length > 0);
    if (tasksWithDependencies.length > tasks.length * 0.3) {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-schedule-002');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.7,
                reason: '超过30%的任务存在依赖关系，依赖项延期可能影响整体进度',
                relatedFactors: ['任务依赖', '关键路径'],
            });
        }
    }

    return suggestions;
};

/**
 * Analyze cost-related risks
 */
const analyzeCostRisks = (project: Project): RiskSuggestion[] => {
    const suggestions: RiskSuggestion[] = [];

    // Check budget utilization
    const budget = project.budget || 0;
    const actualCost = project.actualCost || 0;
    const budgetUsage = budget > 0 ? actualCost / budget : 0;

    if (budgetUsage > 0.7 && project.status !== 'completed') {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-cost-001');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.9,
                reason: `预算已使用${(budgetUsage * 100).toFixed(0)}%，但项目尚未完成，存在预算超支风险`,
                relatedFactors: ['预算使用率', '项目进度'],
            });
        }
    }

    // Check for missing cost tracking
    if (!project.costHistory || project.costHistory.length === 0) {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-cost-002');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.6,
                reason: '缺少成本记录，可能存在隐藏成本未被追踪',
                relatedFactors: ['成本追踪', '透明度'],
            });
        }
    }

    return suggestions;
};

/**
 * Analyze resource-related risks
 */
const analyzeResourceRisks = (project: Project): RiskSuggestion[] => {
    const suggestions: RiskSuggestion[] = [];

    // Check resource allocation
    const resourceRequirements = project.resourceRequirements || [];
    if (resourceRequirements.length === 0 && project.status === 'active') {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-resource-002');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.75,
                reason: '项目已启动但未明确资源需求，可能存在技能不匹配风险',
                relatedFactors: ['资源规划', '技能匹配'],
            });
        }
    }

    // Check for high-priority projects (resource conflict risk)
    if (project.priority === 'P0' || project.priority === 'P1') {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-resource-003');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.65,
                reason: '高优先级项目可能与其他项目争夺关键资源',
                relatedFactors: ['项目优先级', '资源竞争'],
            });
        }
    }

    return suggestions;
};

/**
 * Analyze technical risks
 */
const analyzeTechnicalRisks = (project: Project): RiskSuggestion[] => {
    const suggestions: RiskSuggestion[] = [];

    // Check for new/innovative projects
    if (project.factors?.innovation && project.factors.innovation > 7) {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-technical-001');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.8,
                reason: '项目创新度较高，可能涉及新技术，存在技术选型风险',
                relatedFactors: ['创新度', '技术复杂度'],
            });
        }
    }

    // Check technical risk factor
    if (project.factors?.risk && project.factors.risk < 5) {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-technical-003');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.7,
                reason: '技术风险评分较低，建议关注安全漏洞和技术债务',
                relatedFactors: ['技术风险', '安全性'],
            });
        }
    }

    return suggestions;
};

/**
 * Analyze quality risks
 */
const analyzeQualityRisks = (project: Project): RiskSuggestion[] => {
    const suggestions: RiskSuggestion[] = [];
    const tasks = project.tasks || [];

    // Check for rapid development (potential quality issues)
    const projectDuration = new Date(project.endDate).getTime() - new Date(project.startDate).getTime();
    const daysRemaining = projectDuration / (1000 * 60 * 60 * 24);

    if (daysRemaining < 60 && tasks.length > 15) {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-quality-001');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.75,
                reason: '开发周期短且任务量大，可能影响质量标准',
                relatedFactors: ['开发周期', '任务复杂度'],
            });
        }
    }

    // Check for technical debt risk
    if (project.status === 'active' && project.progress && project.progress > 50) {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-quality-002');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.6,
                reason: '项目已进行过半，建议评估技术债务累积情况',
                relatedFactors: ['项目进度', '代码质量'],
            });
        }
    }

    return suggestions;
};

/**
 * Analyze scope risks
 */
const analyzeScopeRisks = (project: Project): RiskSuggestion[] => {
    const suggestions: RiskSuggestion[] = [];
    const tasks = project.tasks || [];

    // Check for scope creep indicators
    if (tasks.length > 30) {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-scope-001');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.7,
                reason: '任务数量较多（>30个），需警惕需求蔓延',
                relatedFactors: ['任务数量', '范围管理'],
            });
        }
    }

    // Check for unclear requirements
    if (!project.description || project.description.length < 50) {
        const template = RISK_TEMPLATES.find((t) => t.id === 'tmpl-scope-002');
        if (template) {
            suggestions.push({
                template,
                confidence: 0.65,
                reason: '项目描述不够详细，可能存在需求不明确的风险',
                relatedFactors: ['需求文档', '项目定义'],
            });
        }
    }

    return suggestions;
};

/**
 * Analyze historical patterns from similar projects
 */
const analyzeHistoricalPatterns = (project: Project, allProjects: Project[]): RiskSuggestion[] => {
    const suggestions: RiskSuggestion[] = [];

    // Find similar completed projects
    const similarProjects = allProjects.filter(
        (p) =>
            p.id !== project.id &&
            p.status === 'completed' &&
            p.priority === project.priority &&
            p.risks &&
            p.risks.length > 0
    );

    if (similarProjects.length === 0) return suggestions;

    // Analyze common risks in similar projects
    const riskFrequency: Map<string, { count: number; category: RiskCategory }> = new Map();

    similarProjects.forEach((p) => {
        p.risks?.forEach((risk) => {
            const key = risk.category;
            const current = riskFrequency.get(key) || { count: 0, category: risk.category };
            riskFrequency.set(key, { count: current.count + 1, category: risk.category });
        });
    });

    // Suggest risks that occurred frequently in similar projects
    riskFrequency.forEach((data, category) => {
        const frequency = data.count / similarProjects.length;
        if (frequency > 0.5) {
            // If more than 50% of similar projects had this type of risk
            const templates = RISK_TEMPLATES.filter((t) => t.category === data.category);
            if (templates.length > 0) {
                suggestions.push({
                    template: templates[0],
                    confidence: Math.min(0.9, frequency),
                    reason: `类似项目中${(frequency * 100).toFixed(0)}%遇到了${category}类风险`,
                    relatedFactors: ['历史数据', '项目相似度'],
                });
            }
        }
    });

    return suggestions;
};

/**
 * Get risk insights and recommendations
 */
export const getRiskInsights = (risks: Risk[]): string[] => {
    const insights: string[] = [];

    const activeRisks = risks.filter((r) => r.status !== 'resolved' && r.status !== 'accepted');
    const criticalRisks = activeRisks.filter((r) => r.priority === 'critical');
    const highRisks = activeRisks.filter((r) => r.priority === 'high');

    // Critical risk alert
    if (criticalRisks.length > 0) {
        insights.push(
            `⚠️ 发现 ${criticalRisks.length} 个极高风险，建议立即采取缓解措施并分配专人负责`
        );
    }

    // High risk concentration
    if (highRisks.length > 3) {
        insights.push(`🔴 高风险数量较多（${highRisks.length}个），建议优先处理并增加评审频率`);
    }

    // Mitigation coverage
    const risksWithMitigation = activeRisks.filter((r) => r.mitigationStrategy && r.mitigationStrategy.length > 0);
    const mitigationCoverage = activeRisks.length > 0 ? risksWithMitigation.length / activeRisks.length : 0;

    if (mitigationCoverage < 0.5) {
        insights.push(`💡 仅${(mitigationCoverage * 100).toFixed(0)}%的活跃风险有缓解策略，建议完善风险应对计划`);
    }

    // Action item tracking
    const totalActions = activeRisks.reduce((sum, r) => sum + r.mitigationActions.length, 0);
    const completedActions = activeRisks.reduce(
        (sum, r) => sum + r.mitigationActions.filter((a) => a.status === 'completed').length,
        0
    );

    if (totalActions > 0) {
        const completionRate = completedActions / totalActions;
        if (completionRate < 0.3) {
            insights.push(`📋 缓解措施完成率较低（${(completionRate * 100).toFixed(0)}%），建议加快执行进度`);
        }
    }

    // Category concentration
    const categoryCount: Record<RiskCategory, number> = {
        schedule: 0,
        cost: 0,
        resource: 0,
        technical: 0,
        external: 0,
        quality: 0,
        scope: 0,
    };

    activeRisks.forEach((r) => {
        categoryCount[r.category]++;
    });

    const dominantCategory = Object.entries(categoryCount).reduce((max, [cat, count]) =>
        count > max[1] ? [cat, count] : max
        , ['', 0]);

    if (dominantCategory[1] > activeRisks.length * 0.4) {
        insights.push(`📊 ${dominantCategory[0]}类风险占比较高（${dominantCategory[1]}个），建议针对性加强管理`);
    }

    return insights;
};
