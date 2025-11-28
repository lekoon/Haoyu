/**
 * Performance monitoring utilities
 * Helps identify performance bottlenecks in development
 */

interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private timers: Map<string, number> = new Map();
    private enabled: boolean = import.meta.env.DEV;

    /**
     * Start timing an operation
     */
    start(name: string): void {
        if (!this.enabled) return;
        this.timers.set(name, performance.now());
    }

    /**
     * End timing and record metric
     */
    end(name: string): number | null {
        if (!this.enabled) return null;

        const startTime = this.timers.get(name);
        if (!startTime) {
            console.warn(`Performance timer "${name}" was not started`);
            return null;
        }

        const duration = performance.now() - startTime;
        this.timers.delete(name);

        this.metrics.push({
            name,
            duration,
            timestamp: Date.now(),
        });

        // Log slow operations (> 100ms)
        if (duration > 100) {
            console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    /**
     * Measure a function execution time
     */
    async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
        if (!this.enabled) return await fn();

        this.start(name);
        try {
            const result = await fn();
            this.end(name);
            return result;
        } catch (error) {
            this.end(name);
            throw error;
        }
    }

    /**
     * Get all metrics
     */
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Get metrics by name
     */
    getMetricsByName(name: string): PerformanceMetric[] {
        return this.metrics.filter((m) => m.name === name);
    }

    /**
     * Get average duration for a metric
     */
    getAverageDuration(name: string): number {
        const metrics = this.getMetricsByName(name);
        if (metrics.length === 0) return 0;

        const total = metrics.reduce((sum, m) => sum + m.duration, 0);
        return total / metrics.length;
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics = [];
        this.timers.clear();
    }

    /**
     * Generate performance report
     */
    generateReport(): string {
        if (this.metrics.length === 0) {
            return 'No performance metrics recorded';
        }

        const grouped = this.metrics.reduce((acc, metric) => {
            if (!acc[metric.name]) {
                acc[metric.name] = [];
            }
            acc[metric.name].push(metric.duration);
            return acc;
        }, {} as Record<string, number[]>);

        let report = '📊 Performance Report\n\n';

        Object.entries(grouped).forEach(([name, durations]) => {
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
            const min = Math.min(...durations);
            const max = Math.max(...durations);

            report += `${name}:\n`;
            report += `  Count: ${durations.length}\n`;
            report += `  Average: ${avg.toFixed(2)}ms\n`;
            report += `  Min: ${min.toFixed(2)}ms\n`;
            report += `  Max: ${max.toFixed(2)}ms\n\n`;
        });

        return report;
    }

    /**
     * Log performance report to console
     */
    logReport(): void {
        console.log(this.generateReport());
    }

    /**
     * Add metric directly (for internal use)
     */
    addMetric(metric: PerformanceMetric): void {
        this.metrics.push(metric);
    }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();
