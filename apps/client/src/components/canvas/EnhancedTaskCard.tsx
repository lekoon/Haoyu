/**
 * Enhanced Task Card Component
 * Supports multiple view modes and rich interactions
 */

import React, { memo } from 'react';
import { Calendar, Link, Paperclip, MessageSquare, MoreVertical, GripVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Task } from '../../types';

interface EnhancedTaskCardProps {
    task: Task;
    x: number;
    y: number;
    width: number;
    height: number;
    isSelected: boolean;
    isHovered: boolean;
    viewMode: 'compact' | 'standard' | 'detailed';
    onMouseDown: (e: React.MouseEvent, mode: 'drag' | 'resize-w' | 'resize-h') => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onDoubleClick: () => void;
    onStartConnection: (e: React.MouseEvent) => void;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = memo(({
    task,
    x,
    y,
    width,
    height,
    isSelected,
    isHovered,
    viewMode,
    onMouseDown,
    onMouseEnter,
    onMouseLeave,
    onContextMenu,
    onDoubleClick,
    onStartConnection,
}) => {
    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'P0': return 'bg-red-500';
            case 'P1': return 'bg-orange-500';
            case 'P2': return 'bg-blue-500';
            case 'P3': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'planning': return 'bg-blue-500';
            case 'completed': return 'bg-gray-400';
            case 'on-hold': return 'bg-yellow-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div
            className={`absolute rounded-xl shadow-lg border-2 bg-white transition-all group ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50 border-blue-500' : 'border-transparent'
                } ${isHovered ? 'shadow-2xl scale-105' : ''}`}
            style={{
                left: x,
                top: y,
                width,
                height,
                cursor: 'move',
            }}
            onMouseDown={(e) => onMouseDown(e, 'drag')}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
        >
            {/* Priority Strip */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${getPriorityColor(task.priority)}`}
            />

            {/* Drag Handle */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1 bg-white rounded shadow-md border border-slate-200 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} className="text-slate-400" />
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate text-sm">{task.name}</h3>
                        {viewMode !== 'compact' && task.description && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{task.description}</p>
                        )}
                    </div>
                    <button
                        className="p-1 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onContextMenu(e);
                        }}
                    >
                        <MoreVertical size={14} className="text-slate-400" />
                    </button>
                </div>

                {/* Progress Bar */}
                {viewMode !== 'compact' && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>进度</span>
                            <span className="font-medium">{task.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getStatusColor(task.status)} transition-all`}
                                style={{ width: `${task.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Metadata */}
                <div className="mt-auto space-y-2">
                    {/* Dates */}
                    {viewMode === 'detailed' && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar size={12} />
                            <span>
                                {format(parseISO(task.startDate), 'MM/dd')} - {format(parseISO(task.endDate), 'MM/dd')}
                            </span>
                        </div>
                    )}

                    {/* Footer Icons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Attachments */}
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Paperclip size={12} />
                                <span>0</span>
                            </div>
                            {/* Comments */}
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <MessageSquare size={12} />
                                <span>0</span>
                            </div>
                            {/* Dependencies */}
                            {task.dependencies && task.dependencies.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Link size={12} />
                                    <span>{task.dependencies.length}</span>
                                </div>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(task.status)}`}>
                            {task.status}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resize Handles */}
            <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onMouseDown(e, 'resize-w');
                }}
            />
            <div
                className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onMouseDown(e, 'resize-h');
                }}
            />

            {/* Connection Point */}
            <button
                className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-lg border-2 border-blue-500 text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onStartConnection(e);
                }}
                title="创建连接"
            >
                <Link size={14} />
            </button>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute -inset-1 border-2 border-blue-500 rounded-xl pointer-events-none" />
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.task.id === nextProps.task.id &&
        prevProps.task.name === nextProps.task.name &&
        prevProps.task.progress === nextProps.task.progress &&
        prevProps.task.status === nextProps.task.status &&
        prevProps.x === nextProps.x &&
        prevProps.y === nextProps.y &&
        prevProps.width === nextProps.width &&
        prevProps.height === nextProps.height &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isHovered === nextProps.isHovered &&
        prevProps.viewMode === nextProps.viewMode
    );
});

EnhancedTaskCard.displayName = 'EnhancedTaskCard';

export default EnhancedTaskCard;
