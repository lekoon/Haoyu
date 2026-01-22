import type { Project } from '../types';

export interface ProjectDependency {
    fromProjectId: string;
    fromProjectName: string;
    toProjectId: string;
    toProjectName: string;
    dependencyType: 'blocks' | 'requires' | 'related';
    description?: string;
    criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface DependencyImpact {
    affectedProjectId: string;
    affectedProjectName: string;
    delayDays: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: string;
}

/**
 * 分析项目延期对依赖项目的影响
 */
export function analyzeDependencyImpact(
    delayedProject: Project,
    delayDays: number,
    allProjects: Project[],
    dependencies: ProjectDependency[]
): DependencyImpact[] {
    const impacts: DependencyImpact[] = [];

    // 找到所有依赖于延期项目的项目
    const affectedDependencies = dependencies.filter(
        (dep) => dep.fromProjectId === delayedProject.id && dep.dependencyType === 'blocks'
    );

    affectedDependencies.forEach((dep) => {
        const affectedProject = allProjects.find((p) => p.id === dep.toProjectId);
        if (!affectedProject) return;

        // 计算风险等级
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (dep.criticality === 'critical' || delayDays > 30) {
            riskLevel = 'high';
        } else if (dep.criticality === 'high' || delayDays > 14) {
            riskLevel = 'medium';
        }

        // 生成建议
        let recommendation = '';
        if (riskLevel === 'high') {
            recommendation = `建议挂起项目 "${affectedProject.name}" 并释放其资源，避免空耗等待。`;
        } else if (riskLevel === 'medium') {
            recommendation = `建议调整项目 "${affectedProject.name}" 的时间表，或寻找替代方案。`;
        } else {
            recommendation = `继续监控项目 "${affectedProject.name}"，暂无需调整。`;
        }

        impacts.push({
            affectedProjectId: affectedProject.id,
            affectedProjectName: affectedProject.name,
            delayDays,
            riskLevel,
            recommendation,
        });
    });

    return impacts;
}

/**
 * 检测循环依赖
 */
export function detectCircularDependencies(
    dependencies: ProjectDependency[]
): string[][] {
    const cycles: string[][] = [];
    const graph = new Map<string, string[]>();

    // 构建依赖图
    dependencies.forEach((dep) => {
        if (!graph.has(dep.fromProjectId)) {
            graph.set(dep.fromProjectId, []);
        }
        graph.get(dep.fromProjectId)!.push(dep.toProjectId);
    });

    // DFS 检测环
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function dfs(node: string, path: string[]): void {
        visited.add(node);
        recStack.add(node);
        path.push(node);

        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                dfs(neighbor, [...path]);
            } else if (recStack.has(neighbor)) {
                // 找到环
                const cycleStart = path.indexOf(neighbor);
                const cycle = path.slice(cycleStart);
                cycle.push(neighbor); // 闭合环
                cycles.push(cycle);
            }
        }

        recStack.delete(node);
    }

    graph.forEach((_, node) => {
        if (!visited.has(node)) {
            dfs(node, []);
        }
    });

    return cycles;
}

/**
 * 计算关键路径（最长依赖链）
 */
export function calculateCriticalPath(
    dependencies: ProjectDependency[],
    allProjects: Project[]
): {
    path: string[];
    totalDuration: number;
    projects: Project[];
} {
    const graph = new Map<string, string[]>();
    const durations = new Map<string, number>();

    // 构建图和持续时间映射
    dependencies.forEach((dep) => {
        if (!graph.has(dep.fromProjectId)) {
            graph.set(dep.fromProjectId, []);
        }
        graph.get(dep.fromProjectId)!.push(dep.toProjectId);
    });

    allProjects.forEach((project) => {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        durations.set(project.id, days);
    });

    // 使用拓扑排序和动态规划找最长路径
    let longestPath: string[] = [];
    let maxDuration = 0;

    function dfs(node: string, path: string[], duration: number): void {
        const neighbors = graph.get(node) || [];
        if (neighbors.length === 0) {
            // 叶子节点
            if (duration > maxDuration) {
                maxDuration = duration;
                longestPath = [...path];
            }
            return;
        }

        neighbors.forEach((neighbor) => {
            const neighborDuration = durations.get(neighbor) || 0;
            dfs(neighbor, [...path, neighbor], duration + neighborDuration);
        });
    }

    // 从所有根节点开始
    const allNodes = new Set(graph.keys());
    const nonRootNodes = new Set<string>();
    graph.forEach((neighbors) => {
        neighbors.forEach((n) => nonRootNodes.add(n));
    });

    const rootNodes = Array.from(allNodes).filter((n) => !nonRootNodes.has(n));

    rootNodes.forEach((root) => {
        const rootDuration = durations.get(root) || 0;
        dfs(root, [root], rootDuration);
    });

    const pathProjects = longestPath
        .map((id) => allProjects.find((p) => p.id === id))
        .filter((p): p is Project => p !== undefined);

    return {
        path: longestPath,
        totalDuration: maxDuration,
        projects: pathProjects,
    };
}

/**
 * 生成依赖熔断建议
 */
export function generateCircuitBreakerRecommendation(
    delayedProject: Project,
    impact: DependencyImpact,
    waitingCostPerDay: number = 5000 // 默认每天等待成本
): {
    shouldSuspend: boolean;
    estimatedSavings: number;
    recommendation: string;
} {
    const totalWaitingCost = impact.delayDays * waitingCostPerDay;
    const threshold = 50000; // 5万元阈值

    const shouldSuspend = totalWaitingCost > threshold && impact.riskLevel === 'high';

    let recommendation = '';
    if (shouldSuspend) {
        recommendation = `建议立即挂起项目 "${impact.affectedProjectName}"。
        
预计等待成本：¥${totalWaitingCost.toLocaleString()}
建议操作：
1. 暂停项目并释放资源（预计节省 ¥${totalWaitingCost.toLocaleString()}）
2. 将释放的资源重新分配给其他高优先级项目
3. 待项目 "${delayedProject.name}" 完成后再重启

风险：项目 "${impact.affectedProjectName}" 的整体交付时间将延后 ${impact.delayDays} 天。`;
    } else {
        recommendation = `继续等待项目 "${delayedProject.name}" 完成。
        
预计等待成本：¥${totalWaitingCost.toLocaleString()}（低于熔断阈值）
建议操作：
1. 密切监控项目 "${delayedProject.name}" 的进度
2. 准备应急计划以防进一步延期
3. 考虑部分资源的临时调配`;
    }

    return {
        shouldSuspend,
        estimatedSavings: shouldSuspend ? totalWaitingCost : 0,
        recommendation,
    };
}
