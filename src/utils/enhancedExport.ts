import { Project, Task, ResourcePoolItem, Risk, ExportConfig } from '../types';
import { format } from 'date-fns';

/**
 * Enhanced data export utilities with configurable options
 */

export interface ExportOptions {
    format: 'csv' | 'excel' | 'json' | 'pdf';
    fields?: string[];
    filters?: Record<string, any>;
    includeHeaders?: boolean;
    dateFormat?: string;
    filename?: string;
}

/**
 * Generic CSV export function
 */
export const exportToCSV = <T extends Record<string, any>>(
    data: T[],
    fields: string[],
    headers: Record<string, string>,
    filename: string
): void => {
    if (data.length === 0) {
        alert('没有数据可导出');
        return;
    }

    // Create CSV content
    const csvHeaders = fields.map((field) => headers[field] || field).join(',');
    const csvRows = data.map((item) => {
        return fields
            .map((field) => {
                const value = getNestedValue(item, field);
                // Handle special cases
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
                return value;
            })
            .join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Create and download file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Generic JSON export function
 */
export const exportToJSON = <T>(data: T[], filename: string): void => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export projects with enhanced options
 */
export const exportProjects = (projects: Project[], options: ExportOptions): void => {
    const defaultFields = [
        'name',
        'status',
        'priority',
        'owner',
        'startDate',
        'endDate',
        'budget',
        'actualCost',
        'progress',
        'description',
    ];

    const fields = options.fields || defaultFields;
    const headers: Record<string, string> = {
        name: '项目名称',
        status: '状态',
        priority: '优先级',
        owner: '负责人',
        startDate: '开始日期',
        endDate: '结束日期',
        budget: '预算',
        actualCost: '实际成本',
        progress: '进度',
        description: '描述',
    };

    // Apply filters
    let filteredData = projects;
    if (options.filters) {
        filteredData = applyFilters(projects, options.filters);
    }

    // Export based on format
    switch (options.format) {
        case 'csv':
            exportToCSV(filteredData, fields, headers, options.filename || '项目列表');
            break;
        case 'json':
            exportToJSON(filteredData, options.filename || '项目列表');
            break;
        case 'excel':
            exportToExcelHTML(filteredData, fields, headers, options.filename || '项目列表');
            break;
        default:
            console.error('Unsupported export format');
    }
};

/**
 * Export tasks with enhanced options
 */
export const exportTasks = (tasks: Task[], options: ExportOptions): void => {
    const defaultFields = ['name', 'startDate', 'endDate', 'progress', 'type', 'dependencies'];

    const fields = options.fields || defaultFields;
    const headers: Record<string, string> = {
        name: '任务名称',
        startDate: '开始日期',
        endDate: '结束日期',
        progress: '进度',
        type: '类型',
        dependencies: '依赖',
    };

    let filteredData = tasks;
    if (options.filters) {
        filteredData = applyFilters(tasks, options.filters);
    }

    switch (options.format) {
        case 'csv':
            exportToCSV(filteredData, fields, headers, options.filename || '任务列表');
            break;
        case 'json':
            exportToJSON(filteredData, options.filename || '任务列表');
            break;
        default:
            console.error('Unsupported export format');
    }
};

/**
 * Export resources with enhanced options
 */
export const exportResources = (resources: ResourcePoolItem[], options: ExportOptions): void => {
    const defaultFields = ['name', 'totalQuantity', 'costPerUnit', 'skills'];

    const fields = options.fields || defaultFields;
    const headers: Record<string, string> = {
        name: '资源名称',
        totalQuantity: '总数量',
        costPerUnit: '单位成本',
        skills: '技能',
    };

    let filteredData = resources;
    if (options.filters) {
        filteredData = applyFilters(resources, options.filters);
    }

    switch (options.format) {
        case 'csv':
            exportToCSV(filteredData, fields, headers, options.filename || '资源列表');
            break;
        case 'json':
            exportToJSON(filteredData, options.filename || '资源列表');
            break;
        default:
            console.error('Unsupported export format');
    }
};

/**
 * Export to Excel-compatible HTML
 */
const exportToExcelHTML = <T extends Record<string, any>>(
    data: T[],
    fields: string[],
    headers: Record<string, string>,
    filename: string
): void => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #2563eb; color: white; padding: 10px; text-align: left; font-weight: bold; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <table>
        <thead>
            <tr>
                ${fields.map((field) => `<th>${headers[field] || field}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data
            .map(
                (item) => `
                <tr>
                    ${fields.map((field) => `<td>${getNestedValue(item, field) || ''}</td>`).join('')}
                </tr>
            `
            )
            .join('')}
        </tbody>
    </table>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Apply filters to data
 */
const applyFilters = <T extends Record<string, any>>(data: T[], filters: Record<string, any>): T[] => {
    return data.filter((item) => {
        return Object.entries(filters).every(([key, value]) => {
            const itemValue = getNestedValue(item, key);
            if (Array.isArray(value)) {
                return value.includes(itemValue);
            }
            return itemValue === value;
        });
    });
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Batch export multiple entities
 */
export const batchExport = (
    entities: {
        type: 'projects' | 'tasks' | 'resources' | 'risks';
        data: any[];
        options: ExportOptions;
    }[]
): void => {
    entities.forEach(({ type, data, options }) => {
        switch (type) {
            case 'projects':
                exportProjects(data, options);
                break;
            case 'tasks':
                exportTasks(data, options);
                break;
            case 'resources':
                exportResources(data, options);
                break;
            default:
                console.error(`Unsupported entity type: ${type}`);
        }
    });
};
