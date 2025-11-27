import React, { useState, useMemo } from 'react';
import { FileText, Download, Eye, X, Plus, Trash2, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import type { Project, ResourcePoolItem } from '../types';
import { format } from 'date-fns';

interface ReportField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'status' | 'priority' | 'progress';
    source: 'project' | 'resource' | 'calculated';
}

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    fields: string[]; // Field IDs
    filters: {
        status?: string[];
        priority?: string[];
        dateRange?: { start: string; end: string };
    };
    groupBy?: string;
    sortBy?: string;
    chartType?: 'table' | 'bar' | 'pie' | 'line';
}

interface AdvancedReportGeneratorProps {
    projects: Project[];
    resources: ResourcePoolItem[];
    onClose: () => void;
}

const AdvancedReportGenerator: React.FC<AdvancedReportGeneratorProps> = ({ projects, resources, onClose }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
    const [customFields, setCustomFields] = useState<string[]>([]);
    const [filters, setFilters] = useState<ReportTemplate['filters']>({});
    const [reportName, setReportName] = useState('');

    // Available fields
    const availableFields: ReportField[] = [
        { id: 'name', label: '项目名称', type: 'text', source: 'project' },
        { id: 'description', label: '项目描述', type: 'text', source: 'project' },
        { id: 'status', label: '状态', type: 'status', source: 'project' },
        { id: 'priority', label: '优先级', type: 'priority', source: 'project' },
        { id: 'startDate', label: '开始日期', type: 'date', source: 'project' },
        { id: 'endDate', label: '结束日期', type: 'date', source: 'project' },
        { id: 'score', label: '评分', type: 'number', source: 'project' },
        { id: 'budget', label: '预算', type: 'number', source: 'project' },
        { id: 'actualCost', label: '实际成本', type: 'number', source: 'project' },
        { id: 'resourceCount', label: '资源数量', type: 'number', source: 'calculated' },
        { id: 'milestoneCount', label: '里程碑数量', type: 'number', source: 'calculated' },
        { id: 'progress', label: '进度', type: 'progress', source: 'calculated' },
    ];

    // Built-in templates
    const builtInTemplates: ReportTemplate[] = [
        {
            id: 'summary',
            name: '项目概览报表',
            description: '所有项目的基本信息汇总',
            fields: ['name', 'status', 'priority', 'startDate', 'endDate', 'score'],
            filters: {},
            chartType: 'table'
        },
        {
            id: 'budget',
            name: '预算分析报表',
            description: '项目预算与实际成本对比',
            fields: ['name', 'budget', 'actualCost', 'status'],
            filters: {},
            chartType: 'bar'
        },
        {
            id: 'priority',
            name: '优先级分布',
            description: '按优先级统计项目数量',
            fields: ['priority', 'name', 'status'],
            filters: {},
            groupBy: 'priority',
            chartType: 'pie'
        },
        {
            id: 'timeline',
            name: '时间线报表',
            description: '项目时间安排概览',
            fields: ['name', 'startDate', 'endDate', 'status', 'progress'],
            filters: {},
            sortBy: 'startDate',
            chartType: 'table'
        },
        {
            id: 'resource',
            name: '资源分配报表',
            description: '项目资源使用情况',
            fields: ['name', 'resourceCount', 'status', 'priority'],
            filters: {},
            chartType: 'bar'
        },
    ];

    // Calculate field value
    const getFieldValue = (project: Project, fieldId: string): any => {
        switch (fieldId) {
            case 'resourceCount':
                return project.resourceRequirements.reduce((sum, req) => sum + req.count, 0);
            case 'milestoneCount':
                return project.milestones?.length || 0;
            case 'progress':
                const completed = project.milestones?.filter(m => m.completed).length || 0;
                const total = project.milestones?.length || 1;
                return Math.round((completed / total) * 100);
            default:
                return (project as any)[fieldId];
        }
    };

    // Filter projects
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            if (filters.status && filters.status.length > 0 && !filters.status.includes(project.status)) {
                return false;
            }
            if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(project.priority)) {
                return false;
            }
            if (filters.dateRange) {
                const projectStart = new Date(project.startDate);
                const filterStart = new Date(filters.dateRange.start);
                const filterEnd = new Date(filters.dateRange.end);
                if (projectStart < filterStart || projectStart > filterEnd) {
                    return false;
                }
            }
            return true;
        });
    }, [projects, filters]);

    // Generate report data
    const reportData = useMemo(() => {
        if (!selectedTemplate) return [];

        return filteredProjects.map(project => {
            const row: any = { id: project.id };
            selectedTemplate.fields.forEach(fieldId => {
                row[fieldId] = getFieldValue(project, fieldId);
            });
            return row;
        });
    }, [selectedTemplate, filteredProjects]);

    // Export to CSV
    const exportToCSV = () => {
        if (!selectedTemplate || reportData.length === 0) return;

        const headers = selectedTemplate.fields.map(fieldId => {
            const field = availableFields.find(f => f.id === fieldId);
            return field?.label || fieldId;
        });

        const rows = [headers.join(',')];
        reportData.forEach(row => {
            const values = selectedTemplate.fields.map(fieldId => {
                const value = row[fieldId];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
                return value;
            });
            rows.push(values.join(','));
        });

        const csvContent = '\uFEFF' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${reportName || selectedTemplate.name}_${format(new Date(), 'yyyyMMdd')}.csv`;
        link.click();
    };

    // Export to Excel (HTML)
    const exportToExcel = () => {
        if (!selectedTemplate || reportData.length === 0) return;

        let html = `
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    table { border-collapse: collapse; font-family: Arial, sans-serif; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #4CAF50; color: white; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    tr:hover { background-color: #e8f5e9; }
                    .header { background-color: #2196F3; color: white; padding: 20px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${reportName || selectedTemplate.name}</h1>
                    <p>生成时间: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
                    <p>项目数量: ${reportData.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
        `;

        selectedTemplate.fields.forEach(fieldId => {
            const field = availableFields.find(f => f.id === fieldId);
            html += `<th>${field?.label || fieldId}</th>`;
        });

        html += `
                        </tr>
                    </thead>
                    <tbody>
        `;

        reportData.forEach(row => {
            html += '<tr>';
            selectedTemplate.fields.forEach(fieldId => {
                const value = row[fieldId];
                html += `<td>${value !== null && value !== undefined ? value : '-'}</td>`;
            });
            html += '</tr>';
        });

        html += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${reportName || selectedTemplate.name}_${format(new Date(), 'yyyyMMdd')}.html`;
        link.click();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">高级报表生成器</h2>
                                <p className="text-sm text-indigo-100 mt-1">
                                    自定义报表字段、筛选条件和导出格式
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-3 gap-6">
                        {/* Templates */}
                        <div className="col-span-1">
                            <h3 className="font-bold text-lg mb-4">报表模板</h3>
                            <div className="space-y-2">
                                {builtInTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                                : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                            }`}
                                    >
                                        <h4 className="font-bold text-slate-900 mb-1">{template.name}</h4>
                                        <p className="text-xs text-slate-500">{template.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {template.chartType === 'table' && <BarChart3 size={14} className="text-slate-400" />}
                                            {template.chartType === 'bar' && <BarChart3 size={14} className="text-blue-500" />}
                                            {template.chartType === 'pie' && <PieChart size={14} className="text-green-500" />}
                                            <span className="text-xs text-slate-500">{template.fields.length} 个字段</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="col-span-2">
                            {selectedTemplate ? (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            报表名称
                                        </label>
                                        <input
                                            type="text"
                                            value={reportName}
                                            onChange={(e) => setReportName(e.target.value)}
                                            placeholder={selectedTemplate.name}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    {/* Filters */}
                                    <div className="mb-6">
                                        <h3 className="font-bold text-lg mb-3">筛选条件</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    状态
                                                </label>
                                                <select
                                                    multiple
                                                    value={filters.status || []}
                                                    onChange={(e) => {
                                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                        setFilters({ ...filters, status: selected });
                                                    }}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="planning">Planning</option>
                                                    <option value="active">Active</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="on-hold">On Hold</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    优先级
                                                </label>
                                                <select
                                                    multiple
                                                    value={filters.priority || []}
                                                    onChange={(e) => {
                                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                        setFilters({ ...filters, priority: selected });
                                                    }}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="P0">P0</option>
                                                    <option value="P1">P1</option>
                                                    <option value="P2">P2</option>
                                                    <option value="P3">P3</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <div className="mb-6">
                                        <h3 className="font-bold text-lg mb-3">数据预览</h3>
                                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        {selectedTemplate.fields.map(fieldId => {
                                                            const field = availableFields.find(f => f.id === fieldId);
                                                            return (
                                                                <th key={fieldId} className="p-3 text-left font-semibold text-slate-700">
                                                                    {field?.label || fieldId}
                                                                </th>
                                                            );
                                                        })}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {reportData.slice(0, 10).map(row => (
                                                        <tr key={row.id} className="hover:bg-slate-50">
                                                            {selectedTemplate.fields.map(fieldId => (
                                                                <td key={fieldId} className="p-3 text-slate-600">
                                                                    {row[fieldId] !== null && row[fieldId] !== undefined ? row[fieldId] : '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            显示前 10 条，共 {reportData.length} 条记录
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <div className="text-center">
                                        <FileText size={64} className="mx-auto mb-4 opacity-50" />
                                        <p>请选择一个报表模板</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            {selectedTemplate && (
                                <span>
                                    已选择: <strong>{selectedTemplate.name}</strong> |
                                    {reportData.length} 条记录
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={exportToCSV}
                                disabled={!selectedTemplate || reportData.length === 0}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg"
                            >
                                <Download size={18} />
                                导出 CSV
                            </button>
                            <button
                                onClick={exportToExcel}
                                disabled={!selectedTemplate || reportData.length === 0}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-lg"
                            >
                                <Download size={18} />
                                导出 Excel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedReportGenerator;
