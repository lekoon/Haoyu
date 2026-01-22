import type { Project, Risk, RiskCategory } from '../types';

/**
 * Cross-project risk correlation analysis
 */

export interface RiskCorrelation {
    sourceRisk: Risk;
    sourceProject: Project;
    relatedRisks: Array<{
        risk: Risk;
        project: Project;
        correlationScore: number;
        correlationType: 'direct' | 'indirect' | 'cascading';
        reason: string;
    }>;
}

export interface ProjectRiskImpact {
    project: Project;
    impactedBy: Array<{
        sourceProject: Project;
        riskCount: number;
        avgImpact: number;
        criticalRisks: Risk[];
    }>;
    impacting: Array<{
        targetProject: Project;
        riskCount: number;
        avgImpact: number;
        criticalRisks: Risk[];
    }>;
}

/**
 * Analyze risk correlations across projects
 */
export const analyzeRiskCorrelations = (
    targetRisk: Risk,
    targetProject: Project,
    allProjects: Project[]
): RiskCorrelation => {
    const relatedRisks: RiskCorrelation['relatedRisks'] = [];

    allProjects.forEach((project) => {
        if (project.id === targetProject.id) return;

        const projectRisks = project.risks || [];

        projectRisks.forEach((risk) => {
            const correlation = calculateRiskCorrelation(targetRisk, risk, targetProject, project);

            if (correlation.score > 0.3) {
                // Only include significant correlations
                relatedRisks.push({
                    risk,
                    project,
                    correlationScore: correlation.score,
                    correlationType: correlation.type,
                    reason: correlation.reason,
                });
            }
        });
    });

    // Sort by correlation score
    relatedRisks.sort((a, b) => b.correlationScore - a.correlationScore);

    return {
        sourceRisk: targetRisk,
        sourceProject: targetProject,
        relatedRisks,
    };
};

/**
 * Calculate correlation between two risks
 */
const calculateRiskCorrelation = (
    risk1: Risk,
    risk2: Risk,
    project1: Project,
    project2: Project
): { score: number; type: 'direct' | 'indirect' | 'cascading'; reason: string } => {
    let score = 0;
    let type: 'direct' | 'indirect' | 'cascading' = 'indirect';
    const reasons: string[] = [];

    // 1. Same category (strong correlation)
    if (risk1.category === risk2.category) {
        score += 0.4;
        reasons.push(`相同类别（${risk1.category}）`);
    }

    // 2. Similar priority (moderate correlation)
    if (risk1.priority === risk2.priority) {
        score += 0.2;
        reasons.push(`相同优先级（${risk1.priority}）`);
    }

    // 3. Resource dependency
    if (hasResourceDependency(project1, project2)) {
        score += 0.3;
        type = 'direct';
        reasons.push('项目间存在资源共享');
    }

    // 4. Timeline overlap
    const timelineOverlap = calculateTimelineOverlap(project1, project2);
    if (timelineOverlap > 0.5) {
        score += 0.2;
        reasons.push('项目时间线重叠');
    }

    // 5. Similar risk patterns (text similarity)
    const textSimilarity = calculateTextSimilarity(risk1.title + ' ' + risk1.description, risk2.title + ' ' + risk2.description);
    if (textSimilarity > 0.3) {
        score += textSimilarity * 0.3;
        reasons.push('风险描述相似');
    }

    // 6. Cascading risk detection
    if (isCascadingRisk(risk1, risk2, project1, project2)) {
        score += 0.4;
        type = 'cascading';
        reasons.push('可能产生连锁反应');
    }

    // 7. Same stakeholders/owners
    if (risk1.owner === risk2.owner) {
        score += 0.15;
        reasons.push('相同负责人');
    }

    return {
        score: Math.min(score, 1.0),
        type,
        reason: reasons.join('；'),
    };
};

/**
 * Check if projects have resource dependency
 */
const hasResourceDependency = (project1: Project, project2: Project): boolean => {
    const resources1 = new Set((project1.resourceRequirements || []).map((r) => r.resourceId));
    const resources2 = new Set((project2.resourceRequirements || []).map((r) => r.resourceId));

    // Check for shared resources
    for (const res of resources1) {
        if (resources2.has(res)) {
            return true;
        }
    }

    return false;
};

/**
 * Calculate timeline overlap between projects
 */
const calculateTimelineOverlap = (project1: Project, project2: Project): number => {
    const start1 = new Date(project1.startDate).getTime();
    const end1 = new Date(project1.endDate).getTime();
    const start2 = new Date(project2.startDate).getTime();
    const end2 = new Date(project2.endDate).getTime();

    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);

    if (overlapStart >= overlapEnd) return 0;

    const overlapDuration = overlapEnd - overlapStart;
    const totalDuration = Math.max(end1 - start1, end2 - start2);

    return overlapDuration / totalDuration;
};

/**
 * Calculate text similarity using simple word overlap
 */
const calculateTextSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    let commonWords = 0;
    for (const word of words1) {
        if (words2.has(word) && word.length > 2) {
            // Ignore very short words
            commonWords++;
        }
    }

    const totalWords = Math.max(words1.size, words2.size);
    return totalWords > 0 ? commonWords / totalWords : 0;
};

/**
 * Detect if risk2 could be a cascading effect of risk1
 */
const isCascadingRisk = (risk1: Risk, risk2: Risk, project1: Project, project2: Project): boolean => {
    // Schedule risks can cascade to cost risks
    if (risk1.category === 'schedule' && risk2.category === 'cost') {
        return true;
    }

    // Resource risks can cascade to schedule risks
    if (risk1.category === 'resource' && risk2.category === 'schedule') {
        return true;
    }

    // Technical risks can cascade to quality risks
    if (risk1.category === 'technical' && risk2.category === 'quality') {
        return true;
    }

    // Scope risks can cascade to schedule and cost
    if (risk1.category === 'scope' && (risk2.category === 'schedule' || risk2.category === 'cost')) {
        return true;
    }

    return false;
};

/**
 * Analyze project-level risk impacts
 */
export const analyzeProjectRiskImpacts = (allProjects: Project[]): Map<string, ProjectRiskImpact> => {
    const impactMap = new Map<string, ProjectRiskImpact>();

    allProjects.forEach((project) => {
        const impactedBy: ProjectRiskImpact['impactedBy'] = [];
        const impacting: ProjectRiskImpact['impacting'] = [];

        // Analyze how this project is impacted by others
        allProjects.forEach((otherProject) => {
            if (otherProject.id === project.id) return;

            const otherRisks = otherProject.risks || [];
            const relevantRisks: Risk[] = [];

            otherRisks.forEach((risk) => {
                // Check if this risk could impact the current project
                if (couldImpactProject(risk, otherProject, project)) {
                    relevantRisks.push(risk);
                }
            });

            if (relevantRisks.length > 0) {
                const avgImpact =
                    relevantRisks.reduce((sum, r) => sum + r.impact, 0) / relevantRisks.length;
                const criticalRisks = relevantRisks.filter((r) => r.priority === 'critical');

                impactedBy.push({
                    sourceProject: otherProject,
                    riskCount: relevantRisks.length,
                    avgImpact,
                    criticalRisks,
                });
            }
        });

        // Analyze how this project impacts others
        const projectRisks = project.risks || [];
        allProjects.forEach((otherProject) => {
            if (otherProject.id === project.id) return;

            const impactingRisks = projectRisks.filter((risk) =>
                couldImpactProject(risk, project, otherProject)
            );

            if (impactingRisks.length > 0) {
                const avgImpact =
                    impactingRisks.reduce((sum, r) => sum + r.impact, 0) / impactingRisks.length;
                const criticalRisks = impactingRisks.filter((r) => r.priority === 'critical');

                impacting.push({
                    targetProject: otherProject,
                    riskCount: impactingRisks.length,
                    avgImpact,
                    criticalRisks,
                });
            }
        });

        impactMap.set(project.id, {
            project,
            impactedBy,
            impacting,
        });
    });

    return impactMap;
};

/**
 * Check if a risk could impact another project
 */
const couldImpactProject = (risk: Risk, sourceProject: Project, targetProject: Project): boolean => {
    // Resource risks can impact projects sharing resources
    if (risk.category === 'resource' && hasResourceDependency(sourceProject, targetProject)) {
        return true;
    }

    // Schedule risks in high-priority projects can impact others
    if (risk.category === 'schedule' && sourceProject.priority === 'P0' && risk.priority === 'critical') {
        return true;
    }

    // External risks can have broad impact
    if (risk.category === 'external' && risk.impact >= 4) {
        return true;
    }

    return false;
};

/**
 * Get risk network graph data for visualization
 */
export interface RiskNetworkNode {
    id: string;
    label: string;
    type: 'project' | 'risk';
    priority?: string;
    category?: RiskCategory;
    size: number;
}

export interface RiskNetworkEdge {
    source: string;
    target: string;
    weight: number;
    type: string;
}

export const generateRiskNetwork = (
    allProjects: Project[]
): { nodes: RiskNetworkNode[]; edges: RiskNetworkEdge[] } => {
    const nodes: RiskNetworkNode[] = [];
    const edges: RiskNetworkEdge[] = [];

    // Add project nodes
    allProjects.forEach((project) => {
        const riskCount = (project.risks || []).length;
        nodes.push({
            id: `project-${project.id}`,
            label: project.name,
            type: 'project',
            size: Math.max(10, riskCount * 2),
        });

        // Add high-priority risk nodes
        (project.risks || [])
            .filter((r) => r.priority === 'critical' || r.priority === 'high')
            .forEach((risk) => {
                nodes.push({
                    id: `risk-${risk.id}`,
                    label: risk.title,
                    type: 'risk',
                    priority: risk.priority,
                    category: risk.category,
                    size: risk.riskScore,
                });

                // Connect risk to its project
                edges.push({
                    source: `project-${project.id}`,
                    target: `risk-${risk.id}`,
                    weight: risk.riskScore / 25,
                    type: 'contains',
                });
            });
    });

    // Add correlation edges
    allProjects.forEach((project) => {
        (project.risks || [])
            .filter((r) => r.priority === 'critical' || r.priority === 'high')
            .forEach((risk) => {
                const correlations = analyzeRiskCorrelations(risk, project, allProjects);

                correlations.relatedRisks
                    .filter((rel) => rel.correlationScore > 0.5)
                    .forEach((rel) => {
                        edges.push({
                            source: `risk-${risk.id}`,
                            target: `risk-${rel.risk.id}`,
                            weight: rel.correlationScore,
                            type: rel.correlationType,
                        });
                    });
            });
    });

    return { nodes, edges };
};
