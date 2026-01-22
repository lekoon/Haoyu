/**
 * Real-time Performance Monitor Component
 * Displays performance metrics in development mode
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, X, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { perfMonitor } from '../utils/performanceMonitor';

interface PerformanceStats {
    fps: number;
    memory: number;
    renderTime: number;
    slowOperations: number;
}

const PerformanceMonitor: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [stats, setStats] = useState<PerformanceStats>({
        fps: 60,
        memory: 0,
        renderTime: 0,
        slowOperations: 0,
    });
    const [isExpanded, setIsExpanded] = useState(false);

    // Only show in development
    if (import.meta.env.PROD) return null;

    // FPS Counter
    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId: number;

        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime >= lastTime + 1000) {
                setStats(prev => ({
                    ...prev,
                    fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
                }));
                frameCount = 0;
                lastTime = currentTime;
            }

            animationFrameId = requestAnimationFrame(measureFPS);
        };

        animationFrameId = requestAnimationFrame(measureFPS);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Memory Usage (if available)
    useEffect(() => {
        const updateMemory = () => {
            if ('memory' in performance) {
                const mem = (performance as any).memory;
                const usedMB = mem.usedJSHeapSize / 1048576;
                setStats(prev => ({ ...prev, memory: Math.round(usedMB) }));
            }
        };

        const interval = setInterval(updateMemory, 2000);
        return () => clearInterval(interval);
    }, []);

    // Monitor slow operations
    useEffect(() => {
        const interval = setInterval(() => {
            const metrics = perfMonitor.getMetrics();
            const slowOps = metrics.filter(m => m.duration > 100).length;
            setStats(prev => ({ ...prev, slowOperations: slowOps }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const getFPSColor = (fps: number) => {
        if (fps >= 55) return 'text-green-500';
        if (fps >= 30) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getMemoryColor = (mb: number) => {
        if (mb < 50) return 'text-green-500';
        if (mb < 100) return 'text-yellow-500';
        return 'text-red-500';
    };

    const handleShowReport = useCallback(() => {
        perfMonitor.logReport();
        console.log('📊 Performance metrics logged to console');
    }, []);

    const handleClearMetrics = useCallback(() => {
        perfMonitor.clear();
        setStats(prev => ({ ...prev, slowOperations: 0 }));
    }, []);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-colors z-50"
                title="Show Performance Monitor"
            >
                <Activity size={20} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-400" />
                    <span className="font-semibold text-sm">Performance Monitor</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        {isExpanded ? '−' : '+'}
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="p-3 space-y-2 min-w-[200px]">
                {/* FPS */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">FPS</span>
                    <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${getFPSColor(stats.fps)}`}>
                            {stats.fps}
                        </span>
                        {stats.fps >= 55 ? (
                            <TrendingUp size={14} className="text-green-500" />
                        ) : (
                            <TrendingDown size={14} className="text-red-500" />
                        )}
                    </div>
                </div>

                {/* Memory */}
                {stats.memory > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Memory</span>
                        <span className={`font-mono font-bold ${getMemoryColor(stats.memory)}`}>
                            {stats.memory} MB
                        </span>
                    </div>
                )}

                {/* Slow Operations */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Slow Ops</span>
                    <span className={`font-mono font-bold ${stats.slowOperations > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {stats.slowOperations}
                    </span>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <>
                        <div className="border-t border-slate-700 pt-2 mt-2">
                            <div className="text-xs text-slate-400 mb-2">Actions</div>
                            <div className="space-y-1">
                                <button
                                    onClick={handleShowReport}
                                    className="w-full text-left text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                                >
                                    📊 Show Report
                                </button>
                                <button
                                    onClick={handleClearMetrics}
                                    className="w-full text-left text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                                >
                                    🗑️ Clear Metrics
                                </button>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="border-t border-slate-700 pt-2 mt-2">
                            <div className="text-xs text-slate-400 mb-1">Performance Tips</div>
                            <div className="text-xs text-slate-500 space-y-1">
                                {stats.fps < 30 && (
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Zap size={10} />
                                        <span>Low FPS detected</span>
                                    </div>
                                )}
                                {stats.memory > 100 && (
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Zap size={10} />
                                        <span>High memory usage</span>
                                    </div>
                                )}
                                {stats.slowOperations > 5 && (
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Zap size={10} />
                                        <span>Multiple slow operations</span>
                                    </div>
                                )}
                                {stats.fps >= 55 && stats.memory < 50 && stats.slowOperations === 0 && (
                                    <div className="text-green-400">✓ Performance is good</div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PerformanceMonitor;
