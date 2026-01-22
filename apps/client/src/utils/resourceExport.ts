/**
 * Resource Export Utilities
 * Export resource data to various formats
 */

import type { ResourceLoad } from './resourcePlanning';
import type { ResourcePoolItem } from '../types';

/**
 * Export resource data to CSV
 */
export const exportResourcesToCSV = (
    resourceLoads: ResourceLoad[],
    buckets: Array<{ label: string; date: Date }>
): void => {
    // Prepare CSV headers
    const headers = ['资源名称', '总容量', ...buckets.map(b => b.label), '平均利用率'];

    // Prepare CSV rows
    const rows = resourceLoads.map(load => {
        const utilizationValues = buckets.map(bucket => {
            const alloc = load.allocations[bucket.label];
            const used = alloc ? alloc.total : 0;
            const utilization = load.capacity > 0 ? (used / load.capacity) * 100 : 0;
            return `${Math.round(utilization)}%`;
        });

        const avgUtilization = buckets.reduce((sum, bucket) => {
            const alloc = load.allocations[bucket.label];
            const used = alloc ? alloc.total : 0;
            const utilization = load.capacity > 0 ? (used / load.capacity) * 100 : 0;
            return sum + utilization;
        }, 0) / buckets.length;

        return [
            load.resourceName,
            load.capacity.toString(),
            ...utilizationValues,
            `${Math.round(avgUtilization)}%`
        ];
    });

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `资源利用率_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export resource pool to CSV
 */
export const exportResourcePoolToCSV = (resources: ResourcePoolItem[]): void => {
    const headers = ['资源名称', '总数量', '已分配', '可用', '技能'];

    const rows = resources.map(resource => {
        const skills = resource.skills?.map(s => s.name).join('; ') || '';
        const allocated = 0; // This would need to be calculated from projects
        const available = resource.totalQuantity - allocated;

        return [
            resource.name,
            resource.totalQuantity.toString(),
            allocated.toString(),
            available.toString(),
            skills
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `资源池_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export to JSON
 */
export const exportToJSON = (data: any, filename: string): void => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Print current view
 */
export const printResourceReport = (): void => {
    window.print();
};
