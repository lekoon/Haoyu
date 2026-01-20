import type { Project, CrossProjectDependency } from '../types';

/**
 * Detect cross-project dependencies based on manual definitions and resource conflicts
 */
export function detectCrossProjectDependencies(projects: Project[]): CrossProjectDependency[] {
    const dependencies: CrossProjectDependency[] = [];
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

    // 1. Process Manual Milestone Dependencies
    // In our UI, Project A defines a dependency on Project B.
    // This means Project B is the PREDECESSOR (source) and Project A is the SUCCESSOR (target).
    activeProjects.forEach(project => {
        (project.milestoneDependencies || []).forEach(md => {
            const predecessorProject = projects.find(p => p.id === md.targetProjectId);
            if (!predecessorProject) return;

            const successorMilestone = project.milestones?.find(m => m.id === md.sourceMilestoneId);
            const predecessorMilestone = predecessorProject.milestones?.find(m => m.id === md.targetMilestoneId);

            dependencies.push({
                id: md.id,
                sourceProjectId: predecessorProject.id,
                sourceProjectName: predecessorProject.name,
                sourceMilestoneId: md.targetMilestoneId,
                sourceMilestoneName: predecessorMilestone?.name,
                targetProjectId: project.id,
                targetProjectName: project.name,
                targetMilestoneId: md.sourceMilestoneId,
                targetMilestoneName: successorMilestone?.name,
                dependencyType: md.type === 'FS' ? 'finish-to-start' :
                    md.type === 'SS' ? 'start-to-start' :
                        md.type === 'FF' ? 'finish-to-finish' : 'start-to-finish',
                description: md.description || `${predecessorProject.name} 的 ${predecessorMilestone?.name || '里程碑'} 阻塞了本项目`,
                criticalPath: false,
                status: 'active',
                createdDate: new Date().toISOString()
            });
        });
    });

    // 2. Auto-detection based on resource conflicts (Secondary)
    for (let i = 0; i < activeProjects.length; i++) {
        for (let j = i + 1; j < activeProjects.length; j++) {
            const project1 = activeProjects[i];
            const project2 = activeProjects[j];

            // Check for resource conflicts (shared resources)
            const sharedResources = findSharedResources(project1, project2);

            if (sharedResources.length > 0) {
                // To avoid duplicate or conflicting auto-deps, we only add if there isn't a manual one
                const manualExists = dependencies.some(d =>
                    (d.sourceProjectId === project1.id && d.targetProjectId === project2.id) ||
                    (d.sourceProjectId === project2.id && d.targetProjectId === project1.id)
                );

                if (!manualExists) {
                    dependencies.push({
                        id: `auto-res-${project1.id}-${project2.id}`,
                        sourceProjectId: project1.id,
                        sourceProjectName: project1.name,
                        targetProjectId: project2.id,
                        targetProjectName: project2.name,
                        dependencyType: 'finish-to-start',
                        description: `共享资源冲突: ${sharedResources.join(', ')}`,
                        criticalPath: false,
                        status: 'active',
                        createdDate: new Date().toISOString()
                    });
                }
            }
        }
    }

    return dependencies;
}

/**
 * Find shared resources between two projects
 */
function findSharedResources(project1: Project, project2: Project): string[] {
    const resources1 = (project1.resourceRequirements || []).map(r => r.resourceId);
    const resources2 = (project2.resourceRequirements || []).map(r => r.resourceId);

    return resources1.filter(r => resources2.includes(r));
}


/**
 * Calculate critical path through cross-project dependencies
 */
export function calculateCriticalPath(
    projects: Project[],
    dependencies: CrossProjectDependency[]
): string[] {
    // Build adjacency list
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    projects.forEach(p => {
        graph.set(p.id, []);
        inDegree.set(p.id, 0);
    });

    dependencies.forEach(dep => {
        graph.get(dep.sourceProjectId)?.push(dep.targetProjectId);
        inDegree.set(dep.targetProjectId, (inDegree.get(dep.targetProjectId) || 0) + 1);
    });

    // Find projects with no dependencies (starting points)
    const queue: string[] = [];
    inDegree.forEach((degree, projectId) => {
        if (degree === 0) {
            queue.push(projectId);
        }
    });

    // Topological sort to find longest path (critical path)
    const distances = new Map<string, number>();
    const predecessors = new Map<string, string | null>();

    projects.forEach(p => {
        distances.set(p.id, 0);
        predecessors.set(p.id, null);
    });

    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentProject = projects.find(p => p.id === current);
        if (!currentProject) continue;

        const currentDuration = Math.ceil(
            (new Date(currentProject.endDate).getTime() - new Date(currentProject.startDate).getTime())
            / (1000 * 60 * 60 * 24)
        );

        const neighbors = graph.get(current) || [];
        neighbors.forEach(neighbor => {
            const newDistance = (distances.get(current) || 0) + currentDuration;
            if (newDistance > (distances.get(neighbor) || 0)) {
                distances.set(neighbor, newDistance);
                predecessors.set(neighbor, current);
            }

            inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        });
    }

    // Find the project with maximum distance (end of critical path)
    let maxDistance = 0;
    let endProject: string | null = null;

    distances.forEach((distance, projectId) => {
        if (distance > maxDistance) {
            maxDistance = distance;
            endProject = projectId;
        }
    });

    // Backtrack to find the critical path
    const criticalPath: string[] = [];
    let current: string | null = endProject;

    while (current) {
        criticalPath.unshift(current);
        current = predecessors.get(current) || null;
    }

    return criticalPath;
}

/**
 * Simulate delay impact on dependent projects
 */
export function simulateDelayImpact(
    projectId: string,
    delayDays: number,
    projects: Project[],
    dependencies: CrossProjectDependency[]
): {
    projectId: string;
    projectName: string;
    originalEndDate: string;
    newEndDate: string;
    delayDays: number;
}[] {
    const impactedProjects: {
        projectId: string;
        projectName: string;
        originalEndDate: string;
        newEndDate: string;
        delayDays: number;
    }[] = [];

    // Build dependency graph
    const dependents = new Map<string, string[]>();
    dependencies.forEach(dep => {
        if (!dependents.has(dep.sourceProjectId)) {
            dependents.set(dep.sourceProjectId, []);
        }
        dependents.get(dep.sourceProjectId)!.push(dep.targetProjectId);
    });

    // BFS to find all impacted projects
    const queue: { projectId: string; accumulatedDelay: number }[] = [
        { projectId, accumulatedDelay: delayDays }
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const { projectId: currentId, accumulatedDelay } = queue.shift()!;

        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const project = projects.find(p => p.id === currentId);
        if (!project) continue;

        if (currentId !== projectId) {
            const originalEndDate = new Date(project.endDate);
            const newEndDate = new Date(originalEndDate);
            newEndDate.setDate(newEndDate.getDate() + accumulatedDelay);

            impactedProjects.push({
                projectId: currentId,
                projectName: project.name,
                originalEndDate: project.endDate,
                newEndDate: newEndDate.toISOString().split('T')[0],
                delayDays: accumulatedDelay
            });
        }

        // Add dependent projects to queue
        const deps = dependents.get(currentId) || [];
        deps.forEach(depId => {
            queue.push({ projectId: depId, accumulatedDelay });
        });
    }

    return impactedProjects;
}

/**
 * Get dependency statistics
 */
export function getDependencyStatistics(
    projects: Project[],
    dependencies: CrossProjectDependency[]
): {
    totalDependencies: number;
    criticalDependencies: number;
    mostDependentProject: { id: string; name: string; count: number } | null;
    mostBlockingProject: { id: string; name: string; count: number } | null;
} {
    const incomingCount = new Map<string, number>();
    const outgoingCount = new Map<string, number>();

    projects.forEach(p => {
        incomingCount.set(p.id, 0);
        outgoingCount.set(p.id, 0);
    });

    dependencies.forEach(dep => {
        outgoingCount.set(dep.sourceProjectId, (outgoingCount.get(dep.sourceProjectId) || 0) + 1);
        incomingCount.set(dep.targetProjectId, (incomingCount.get(dep.targetProjectId) || 0) + 1);
    });

    const criticalDependencies = dependencies.filter(d => d.criticalPath).length;

    // Find most dependent project (most incoming dependencies)
    let maxIncoming = 0;
    let mostDependentProjectId: string | null = null;

    incomingCount.forEach((count, projectId) => {
        if (count > maxIncoming) {
            maxIncoming = count;
            mostDependentProjectId = projectId;
        }
    });

    // Find most blocking project (most outgoing dependencies)
    let maxOutgoing = 0;
    let mostBlockingProjectId: string | null = null;

    outgoingCount.forEach((count, projectId) => {
        if (count > maxOutgoing) {
            maxOutgoing = count;
            mostBlockingProjectId = projectId;
        }
    });

    const mostDependentProject = mostDependentProjectId
        ? {
            id: mostDependentProjectId,
            name: projects.find(p => p.id === mostDependentProjectId)?.name || '',
            count: maxIncoming
        }
        : null;

    const mostBlockingProject = mostBlockingProjectId
        ? {
            id: mostBlockingProjectId,
            name: projects.find(p => p.id === mostBlockingProjectId)?.name || '',
            count: maxOutgoing
        }
        : null;

    return {
        totalDependencies: dependencies.length,
        criticalDependencies,
        mostDependentProject,
        mostBlockingProject
    };
}
