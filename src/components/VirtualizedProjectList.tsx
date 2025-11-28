/**
 * Virtualized Project List Component
 * Uses react-window for efficient rendering of large lists
 */

import React, { memo, useMemo } from 'react';
// @ts-ignore - react-window types are incomplete
import { FixedSizeList } from 'react-window';
// @ts-ignore - no types available
import AutoSizer from 'react-virtualized-auto-sizer';
import type { Project } from '../types';
import { Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { formatDisplayDate } from '../utils/dateUtils';

interface VirtualizedProjectListProps {
    projects: Project[];
    onProjectClick: (project: Project) => void;
    selectedProjectId?: string;
}

interface ItemData {
    projects: Project[];
    onProjectClick: (project: Project) => void;
    selectedProjectId?: string;
}

interface RowProps {
    index: number;
    style: React.CSSProperties;
    data: ItemData;
}

// Memoized row component for better performance
const ProjectRow = memo<RowProps>(
    ({ index, style, data }) => {
        const { projects, onProjectClick, selectedProjectId } = data;
        const project = projects[index];

        if (!project) return null;

        const isSelected = selectedProjectId === project.id;

        const getStatusColor = (status: Project['status']) => {
            switch (status) {
                case 'active':
                    return 'bg-green-100 text-green-700';
                case 'planning':
                    return 'bg-blue-100 text-blue-700';
                case 'completed':
                    return 'bg-gray-100 text-gray-700';
                case 'on-hold':
                    return 'bg-yellow-100 text-yellow-700';
                default:
                    return 'bg-gray-100 text-gray-700';
            }
        };

        const getPriorityColor = (priority: Project['priority']) => {
            switch (priority) {
                case 'P0':
                    return 'bg-red-100 text-red-700';
                case 'P1':
                    return 'bg-orange-100 text-orange-700';
                case 'P2':
                    return 'bg-blue-100 text-blue-700';
                case 'P3':
                    return 'bg-gray-100 text-gray-700';
                default:
                    return 'bg-gray-100 text-gray-700';
            }
        };

        return (
            <div
                style={style}
                className={`px-4 border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''
                    }`}
                onClick={() => onProjectClick(project)}
            >
                <div className="py-3 flex items-center justify-between">
                    {/* Left: Project Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                            <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                                    project.status
                                )}`}
                            >
                                {project.status}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                                    project.priority
                                )}`}
                            >
                                {project.priority}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 truncate">{project.description}</p>
                    </div>

                    {/* Right: Metrics */}
                    <div className="flex items-center gap-6 ml-4">
                        {/* Date Range */}
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar size={14} />
                            <span>{formatDisplayDate(project.startDate)}</span>
                        </div>

                        {/* Score */}
                        <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-500" />
                            <span className="font-semibold text-blue-600">
                                {project.score?.toFixed(1) || 'N/A'}
                            </span>
                        </div>

                        {/* Budget */}
                        {project.budget && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <DollarSign size={14} />
                                <span>${(project.budget / 1000).toFixed(0)}K</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison for better performance
        const prevProject = prevProps.data.projects[prevProps.index];
        const nextProject = nextProps.data.projects[nextProps.index];

        return (
            prevProject?.id === nextProject?.id &&
            prevProject?.name === nextProject?.name &&
            prevProject?.status === nextProject?.status &&
            prevProject?.score === nextProject?.score &&
            prevProps.data.selectedProjectId === nextProps.data.selectedProjectId &&
            prevProps.style === nextProps.style
        );
    }
);

ProjectRow.displayName = 'ProjectRow';

const VirtualizedProjectList: React.FC<VirtualizedProjectListProps> = ({
    projects,
    onProjectClick,
    selectedProjectId,
}) => {
    // Memoize item data to prevent unnecessary re-renders
    const itemData = useMemo<ItemData>(
        () => ({
            projects,
            onProjectClick,
            selectedProjectId,
        }),
        [projects, onProjectClick, selectedProjectId]
    );

    const itemCount = projects.length;
    const itemSize = 80; // Height of each row in pixels

    if (itemCount === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="text-center">
                    <p className="text-lg font-medium">No projects found</p>
                    <p className="text-sm mt-1">Create a new project to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <AutoSizer>
                {({ height, width }: { height: number; width: number }) => (
                    <FixedSizeList
                        height={height}
                        width={width}
                        itemCount={itemCount}
                        itemSize={itemSize}
                        itemData={itemData}
                        overscanCount={5} // Render 5 extra items outside viewport for smooth scrolling
                    >
                        {ProjectRow}
                    </FixedSizeList>
                )}
            </AutoSizer>
        </div>
    );
};

export default memo(VirtualizedProjectList);
