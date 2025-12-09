/**
 * Canvas Minimap
 * Provides overview and navigation for large canvases
 */

import React, { memo, useRef, useEffect } from 'react';
import type { Task } from '../../types';

interface MinimapProps {
    tasks: Task[];
    viewportBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    scale: number;
    onViewportChange: (x: number, y: number) => void;
}

const Minimap: React.FC<MinimapProps> = memo(({
    tasks,
    viewportBounds,
    scale: _scale,
    onViewportChange,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    const MINIMAP_WIDTH = 200;
    const MINIMAP_HEIGHT = 150;
    const MINIMAP_SCALE = 0.05; // 5% of actual size

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

        // Draw tasks
        ctx.fillStyle = '#3B82F6';
        tasks.forEach((task) => {
            const x = (task.x || 0) * MINIMAP_SCALE;
            const y = (task.y || 0) * MINIMAP_SCALE;
            const width = 100 * MINIMAP_SCALE; // Approximate task width
            const height = (task.height || 80) * MINIMAP_SCALE;

            ctx.fillRect(x, y, width, height);
        });

        // Draw viewport rectangle
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            viewportBounds.x * MINIMAP_SCALE,
            viewportBounds.y * MINIMAP_SCALE,
            viewportBounds.width * MINIMAP_SCALE,
            viewportBounds.height * MINIMAP_SCALE
        );
    }, [tasks, viewportBounds]);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true;
        handleMouseMove(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current && e.type !== 'mousedown') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / MINIMAP_SCALE - viewportBounds.width / 2;
        const y = (e.clientY - rect.top) / MINIMAP_SCALE - viewportBounds.height / 2;

        onViewportChange(-x, -y);
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute bottom-4 right-4 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-40"
        >
            <div className="text-xs font-medium text-slate-600 mb-2">导航</div>
            <canvas
                ref={canvasRef}
                width={MINIMAP_WIDTH}
                height={MINIMAP_HEIGHT}
                className="cursor-pointer bg-slate-50 rounded"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
            />
            <div className="text-xs text-slate-400 mt-2 text-center">
                {tasks.length} 个任务
            </div>
        </div>
    );
});

Minimap.displayName = 'Minimap';

export default Minimap;
