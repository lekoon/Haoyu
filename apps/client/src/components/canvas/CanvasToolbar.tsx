/**
 * Enhanced Canvas Toolbar
 * Provides tools for canvas manipulation and task creation
 */

import React, { memo } from 'react';
import {
    MousePointer2,
    Hand,
    Square,


    StickyNote,
    Plus,
    Minus,
    Maximize2,
    Grid3x3,
    Undo2,
    Redo2,
    Download,
} from 'lucide-react';

interface CanvasToolbarProps {
    activeTool: 'select' | 'pan' | 'task' | 'note' | 'shape' | 'text';
    onToolChange: (tool: 'select' | 'pan' | 'task' | 'note' | 'shape' | 'text') => void;
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
    showGrid: boolean;
    onToggleGrid: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onExport?: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = memo(({
    activeTool,
    onToolChange,
    scale,
    onZoomIn,
    onZoomOut,
    onResetView,
    showGrid,
    onToggleGrid,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
}) => {
    const tools = [
        { id: 'select' as const, icon: MousePointer2, label: '选择 (V)', shortcut: 'V' },
        { id: 'pan' as const, icon: Hand, label: '平移 (H)', shortcut: 'H' },
        { id: 'task' as const, icon: Square, label: '任务 (T)', shortcut: 'T' },
        { id: 'note' as const, icon: StickyNote, label: '便签 (N)', shortcut: 'N' },
    ];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 flex items-center gap-1">
                {/* Tools */}
                <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
                    {tools.map((tool) => {
                        const Icon = tool.icon;
                        const isActive = activeTool === tool.id;
                        return (
                            <button
                                key={tool.id}
                                onClick={() => onToolChange(tool.id)}
                                className={`p-2.5 rounded-lg transition-all ${isActive
                                    ? 'bg-blue-100 text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                title={tool.label}
                            >
                                <Icon size={20} />
                            </button>
                        );
                    })}
                </div>

                {/* Undo/Redo */}
                <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-2.5 rounded-lg transition-all ${canUndo
                            ? 'text-slate-600 hover:bg-slate-100'
                            : 'text-slate-300 cursor-not-allowed'
                            }`}
                        title="撤销 (Ctrl+Z)"
                    >
                        <Undo2 size={20} />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-2.5 rounded-lg transition-all ${canRedo
                            ? 'text-slate-600 hover:bg-slate-100'
                            : 'text-slate-300 cursor-not-allowed'
                            }`}
                        title="重做 (Ctrl+Y)"
                    >
                        <Redo2 size={20} />
                    </button>
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                    <button
                        onClick={onZoomOut}
                        className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
                        title="缩小 (-)"
                    >
                        <Minus size={20} />
                    </button>
                    <button
                        onClick={onResetView}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all min-w-[60px]"
                        title="重置视图"
                    >
                        {(scale * 100).toFixed(0)}%
                    </button>
                    <button
                        onClick={onZoomIn}
                        className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
                        title="放大 (+)"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Display Options */}
                <div className="flex items-center gap-1 px-2">
                    <button
                        onClick={onToggleGrid}
                        className={`p-2.5 rounded-lg transition-all ${showGrid
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        title="切换网格 (G)"
                    >
                        <Grid3x3 size={20} />
                    </button>
                    <button
                        onClick={onResetView}
                        className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
                        title="适应画布"
                    >
                        <Maximize2 size={20} />
                    </button>
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="p-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
                            title="导出"
                        >
                            <Download size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                按 ? 查看所有快捷键
            </div>
        </div>
    );
});

CanvasToolbar.displayName = 'CanvasToolbar';

export default CanvasToolbar;
