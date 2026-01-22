import React, { useMemo } from 'react';
import { AlertTriangle, Users, Calendar } from 'lucide-react';
import type { Project, ResourcePoolItem } from '../types';
import { Card, Badge } from './ui';

interface ResourceConflict {
    resourceId: string;
    resourceName: string;
    conflictingProjects: {
        projectId: string;
        projectName: string;
        allocation: number;
        startDate: string;
        endDate: string;
    }[];
    totalAllocation: number;
    overallocation: number;
}

interface ResourceConflictVisualizerProps {
    projects: Project[];
    resources: ResourcePoolItem[];
}

export const ResourceConflictVisualizer: React.FC<ResourceConflictVisualizerProps> = ({
    projects,
    resources,
}) => {
    const conflicts = useMemo(() => {
        const conflictMap = new Map<string, ResourceConflict>();

        // 分析每个资源的分配情况
        resources.forEach((resource) => {
            const allocations: ResourceConflict['conflictingProjects'] = [];
            let totalAllocation = 0;

            projects.forEach((project) => {
                if (project.status !== 'active') return;

                const resourceAlloc = project.resourceAllocations?.find(
                    (alloc) => alloc.resourceId === resource.id
                );

                if (resourceAlloc) {
                    allocations.push({
                        projectId: project.id,
                        projectName: project.name,
                        allocation: resourceAlloc.hoursPerWeek || 40,
                        startDate: project.startDate,
                        endDate: project.endDate,
                    });
                    totalAllocation += resourceAlloc.hoursPerWeek || 40;
                }
            });

            // 如果总分配超过 40 小时/周，记录为冲突
            if (totalAllocation > 40) {
                conflictMap.set(resource.id, {
                    resourceId: resource.id,
                    resourceName: resource.name,
                    conflictingProjects: allocations,
                    totalAllocation,
                    overallocation: totalAllocation - 40,
                });
            }
        });

        return Array.from(conflictMap.values());
    }, [projects, resources]);

    if (conflicts.length === 0) {
        return (
            <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                            无资源冲突
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            当前所有资源分配均在合理范围内
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    检测到 {conflicts.length} 个资源冲突
                </h3>
            </div>

            {conflicts.map((conflict) => (
                <Card
                    key={conflict.resourceId}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Users className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-red-900 dark:text-red-100">
                                    {conflict.resourceName}
                                </h4>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    总分配: {conflict.totalAllocation}h/周 (超出 {conflict.overallocation}h)
                                </p>
                            </div>
                        </div>
                        <Badge variant="danger">
                            {Math.round((conflict.overallocation / 40) * 100)}% 超载
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-2">
                            冲突项目:
                        </p>
                        {conflict.conflictingProjects.map((proj) => (
                            <div
                                key={proj.projectId}
                                className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded"
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-900 dark:text-slate-100">
                                        {proj.projectName}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                    {proj.allocation}h/周
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-700 dark:text-red-300">
                            💡 建议: 调整项目优先级或增加资源以解决冲突
                        </p>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default ResourceConflictVisualizer;
