import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import type { Project, ResourceRequirement, ProjectTemplate } from '../types';
import { Plus, Trash2, Edit2, X, LayoutList, Kanban, Users, Calendar } from 'lucide-react';
import { calculateProjectScore } from '../utils/algorithm';
import { format, differenceInMonths, parseISO, startOfMonth, endOfMonth, addMonths, differenceInDays, addMonths as addMonthsDate } from 'date-fns';
import TemplateSelector from '../components/TemplateSelector';
import KanbanBoard from '../components/KanbanBoard';
import { useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader, Card, Button, Badge } from '../components/ui';
import { usePMOStore } from '../store/usePMOStore';
import { useKeyTaskDefinitions } from '../store/useStore';
import KeyTaskSettingsModal from '../components/KeyTaskSettingsModal';
import { Settings } from 'lucide-react';

const Projects: React.FC = () => {
    const { projects, addProject, deleteProject, updateProject, factorDefinitions, resourcePool, user } = useStore();
    const { t } = useTranslation();
    const { environmentResources } = usePMOStore();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'gantt'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isKeyTaskSettingsOpen, setIsKeyTaskSettingsOpen] = useState(false);
    const keyTaskDefinitions = useKeyTaskDefinitions();

    // Mock Templates (In a real app, these would come from the store or API)
    const templates: ProjectTemplate[] = [
        {
            id: 'web-app',
            name: 'Web Application',
            description: 'Standard web application development project with frontend and backend.',
            category: 'web',
            defaultDuration: 3,
            defaultFactors: { market: 8, value: 7, risk: 6, roi: 8, strategy: 7, innovation: 6, cost: 5 },
            defaultResources: [
                { resourceId: '', count: 2, duration: 3, unit: 'month', requiredSkills: ['react', 'node'] },
                { resourceId: '', count: 1, duration: 3, unit: 'month', requiredSkills: ['design'] }
            ],
            isBuiltIn: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'mobile-app',
            name: 'Mobile App',
            description: 'iOS and Android mobile application development.',
            category: 'mobile',
            defaultDuration: 4,
            defaultFactors: { market: 9, value: 8, risk: 5, roi: 7, strategy: 8, innovation: 7, cost: 6 },
            defaultResources: [
                { resourceId: '', count: 2, duration: 4, unit: 'month', requiredSkills: ['flutter'] },
                { resourceId: '', count: 1, duration: 2, unit: 'month', requiredSkills: ['qa'] }
            ],
            isBuiltIn: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'data-analytics',
            name: 'Data Analytics Platform',
            description: 'Big data processing and analytics dashboard.',
            category: 'data',
            defaultDuration: 6,
            defaultFactors: { market: 7, value: 9, risk: 4, roi: 9, strategy: 9, innovation: 8, cost: 4 },
            defaultResources: [
                { resourceId: '', count: 3, duration: 6, unit: 'month', requiredSkills: ['python', 'sql'] },
                { resourceId: '', count: 1, duration: 6, unit: 'month', requiredSkills: ['data-science'] }
            ],
            isBuiltIn: true,
            createdAt: new Date().toISOString()
        }
    ];

    // Form State
    const [formData, setFormData] = useState<Partial<Project>>({
        name: '',
        description: '',
        status: 'planning',
        priority: 'P2',
        startDate: '',
        endDate: '',
        category: 'custom',
        department: '',
        budget: 0,
        factors: {},
        resourceRequirements: [],
        milestones: [],
        environmentRequirements: []
    });

    // Initialize factors for new project
    const initializeFactors = () => {
        const factors: Record<string, number> = {};
        factorDefinitions.forEach(f => factors[f.id] = 5);
        return factors;
    };

    const handleOpenModal = (project?: Project) => {
        if (project) {
            setEditingId(project.id);
            // Ensure all current definitions exist in the project factors
            const mergedFactors = { ...project.factors };
            factorDefinitions.forEach(f => {
                if (mergedFactors[f.id] === undefined) mergedFactors[f.id] = 5;
            });
            setFormData({ ...project, factors: mergedFactors });
            setIsModalOpen(true);
        } else {
            // Open template selector for new projects
            setIsTemplateSelectorOpen(true);
        }
    };

    const handleTemplateSelect = (template: ProjectTemplate | null) => {
        setEditingId(null);

        if (template) {
            // One-click creation logic
            const startDate = new Date();
            const endDate = addMonthsDate(startDate, template.defaultDuration);

            // Map default resources to include a valid resourceId from the pool if possible
            const mappedResources = template.defaultResources.map(req => ({
                ...req,
                resourceId: resourcePool[0]?.id || '', // Default to first resource
            }));

            const newProject: Project = {
                id: Math.random().toString(36).substr(2, 9),
                name: `${template.name} - ${format(startDate, 'yyyyMMdd')}`,
                description: template.description,
                status: 'planning',
                priority: 'P2',
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                factors: { ...template.defaultFactors },
                resourceRequirements: mappedResources,
                category: template.category,
                department: template.department,
                budget: template.defaultBudget || 0,
                score: 0, // Will be calculated
                milestones: [], // Initialize empty milestones
                costHistory: [],
                actualCost: 0
            };

            // Calculate initial score
            newProject.score = calculateProjectScore(newProject.factors, factorDefinitions);

            addProject(newProject);
            setIsTemplateSelectorOpen(false);

            // Navigate to detail page for immediate editing
            navigate(`/projects/${newProject.id}`);
        } else {
            // Blank project - open modal
            setFormData({
                name: '',
                description: '',
                status: 'planning',
                priority: 'P2',
                startDate: '',
                endDate: '',
                category: 'custom',
                department: '',
                budget: 0,
                factors: initializeFactors(),
                resourceRequirements: [],
                milestones: [],
                environmentRequirements: []
            });
            setIsTemplateSelectorOpen(false);
            setIsModalOpen(true);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateProject(editingId, formData);
        } else {
            addProject({
                ...formData,
                id: Math.random().toString(36).substr(2, 9),
                score: 0, // Will be calculated by store
                priority: formData.priority || 'P2' // 添加默认优先级
            } as Project);
        }
        setIsModalOpen(false);
    };

    // Resource Requirement Handlers
    const addResourceReq = () => {
        setFormData(prev => ({
            ...prev,
            resourceRequirements: [
                ...(prev.resourceRequirements || []),
                { resourceId: resourcePool[0]?.id || '', count: 1, duration: 1, unit: 'month' }
            ]
        }));
    };

    const removeResourceReq = (index: number) => {
        setFormData(prev => ({
            ...prev,
            resourceRequirements: prev.resourceRequirements?.filter((_, i) => i !== index)
        }));
    };

    const updateResourceReq = (index: number, field: keyof ResourceRequirement, value: any) => {
        setFormData(prev => ({
            ...prev,
            resourceRequirements: prev.resourceRequirements?.map((req, i) =>
                i === index ? { ...req, [field]: value } : req
            )
        }));
    };

    // Milestone Handlers
    const addMilestone = () => {
        setFormData(prev => ({
            ...prev,
            milestones: [
                ...(prev.milestones || []),
                { id: Math.random().toString(36).substr(2, 9), name: '', date: '', completed: false }
            ]
        }));
    };

    const removeMilestone = (index: number) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones?.filter((_, i) => i !== index)
        }));
    };

    const updateMilestone = (index: number, field: keyof any, value: any) => {
        setFormData(prev => ({
            ...prev,
            milestones: prev.milestones?.map((m, i) =>
                i === index ? { ...m, [field]: value } : m
            )
        }));
    };

    // Environment Requirement Handlers
    const addEnvReq = () => {
        setFormData(prev => ({
            ...prev,
            environmentRequirements: [
                ...(prev.environmentRequirements || []),
                { environmentId: environmentResources[0]?.id || '', environmentName: environmentResources[0]?.name || '', startDate: '', endDate: '', purpose: '' }
            ]
        }));
    };

    const removeEnvReq = (index: number) => {
        setFormData(prev => ({
            ...prev,
            environmentRequirements: prev.environmentRequirements?.filter((_, i) => i !== index)
        }));
    };

    const updateEnvReq = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            environmentRequirements: prev.environmentRequirements?.map((req, i) => {
                if (i === index) {
                    if (field === 'environmentId') {
                        const env = environmentResources.find(e => e.id === value);
                        return { ...req, environmentId: value, environmentName: env?.name || '' };
                    }
                    return { ...req, [field]: value };
                }
                return req;
            })
        }));
    };

    const addKeyTask = () => {
        setFormData(prev => ({
            ...prev,
            keyTasks: [
                ...(prev.keyTasks || []),
                {
                    definitionId: keyTaskDefinitions[0]?.id || '',
                    startDate: prev.startDate || new Date().toISOString().split('T')[0],
                    endDate: prev.endDate || new Date().toISOString().split('T')[0]
                }
            ]
        }));
    };

    const updateKeyTask = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            keyTasks: prev.keyTasks?.map((kt, i) => i === index ? { ...kt, [field]: value } : kt)
        }));
    };

    const removeKeyTask = (index: number) => {
        setFormData(prev => ({
            ...prev,
            keyTasks: prev.keyTasks?.filter((_, i) => i !== index)
        }));
    };

    const currentScore = formData.factors ? calculateProjectScore(formData.factors, factorDefinitions) : 0;

    // Kanban Columns - Moved to KanbanBoard component
    // const columns = [
    //     { id: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-700' },
    //     { id: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
    //     { id: 'on-hold', label: 'On Hold', color: 'bg-orange-100 text-orange-700' },
    //     { id: 'completed', label: 'Completed', color: 'bg-purple-100 text-purple-700' },
    // ];

    return (
        <PageContainer>
            <PageHeader
                title="Projects"
                description="Manage and track all your projects"
                actions={
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                icon={Settings}
                                onClick={() => setIsKeyTaskSettingsOpen(true)}
                                size="sm"
                                className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                关键任务
                            </Button>
                        </div>
                        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <LayoutList size={18} />
                                <span className="text-sm font-medium">列表</span>
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <Kanban size={18} />
                                <span className="text-sm font-medium">看板</span>
                            </button>
                            <button
                                onClick={() => setViewMode('gantt')}
                                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'gantt' ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <Calendar size={18} />
                                <span className="text-sm font-medium">甘特图</span>
                            </button>
                        </div>
                        {user?.role !== 'user' && (
                            <Button onClick={() => handleOpenModal()} variant="primary" icon={Plus}>
                                New Project
                            </Button>
                        )}
                    </div>
                }
            />

            {viewMode === 'list' ? (
                <Card padding="none">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Rank</th>
                                <th className="p-4 font-semibold text-slate-600">Project Name</th>
                                <th className="p-4 font-semibold text-slate-600">Status</th>
                                <th className="p-4 font-semibold text-slate-600">Score</th>
                                <th className="p-4 font-semibold text-slate-600">Resources</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.map((project) => (
                                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center">
                                            {project.rank}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div
                                            className="font-medium text-slate-900 cursor-pointer hover:text-blue-600"
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                        >
                                            {project.name}
                                        </div>
                                        <div className="text-sm text-slate-500 truncate max-w-xs">{project.description}</div>
                                    </td>
                                    <td className="p-4">
                                        <Badge
                                            variant={project.status === 'active' ? 'success' : project.status === 'planning' ? 'primary' : 'neutral'}
                                            size="sm"
                                        >
                                            {project.status.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="p-4 font-bold text-blue-600">
                                        {(project.score || 0).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1" title="Total Headcount Required">
                                            <Users size={14} />
                                            {(project.resourceRequirements || []).reduce((sum, req) => sum + req.count, 0)} people
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user?.role !== 'user' && (
                                                <>
                                                    <button onClick={() => handleOpenModal(project)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => deleteProject(project.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            ) : viewMode === 'kanban' ? (
                <div className="overflow-x-auto pb-6">
                    <KanbanBoard onEditProject={handleOpenModal} />
                </div>
            ) : (
                <Card padding="none" className="overflow-hidden">
                    {(() => {
                        const validProjectsForGantt = projects.filter(p => p.startDate && p.endDate);
                        if (validProjectsForGantt.length === 0) {
                            return <div className="p-20 text-center text-slate-400 italic">暂无排程项目</div>;
                        }

                        const startDates = validProjectsForGantt.map(p => parseISO(p.startDate).getTime());
                        const endDates = validProjectsForGantt.map(p => parseISO(p.endDate).getTime());
                        const minDate = startOfMonth(new Date(Math.min(...startDates)));
                        const maxDate = endOfMonth(new Date(Math.max(...endDates)));
                        const totalMonths = differenceInMonths(maxDate, minDate) + 1;
                        const totalDays = differenceInDays(maxDate, minDate) + 1;

                        const monthWidth = 120; // 每个月的宽度
                        const timelineWidth = totalMonths * monthWidth;

                        const today = new Date();
                        const todayOffset = differenceInDays(today, minDate);
                        const todayLeft = (todayOffset / totalDays) * 100;

                        // 生成年份分组
                        const years: { year: string, monthCount: number }[] = [];
                        for (let i = 0; i < totalMonths; i++) {
                            const date = addMonths(minDate, i);
                            const yearStr = format(date, 'yyyy年');
                            if (years.length > 0 && years[years.length - 1].year === yearStr) {
                                years[years.length - 1].monthCount++;
                            } else {
                                years.push({ year: yearStr, monthCount: 1 });
                            }
                        }

                        return (
                            <div className="overflow-x-auto custom-scrollbar group/gantt">
                                <div style={{ width: `calc(14rem + ${timelineWidth}px)` }} className="relative bg-white dark:bg-slate-900 min-h-[400px]">
                                    {/* Timeline Header - Multi Tier */}
                                    <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                        {/* Tier 1: Years */}
                                        <div className="flex">
                                            <div className="w-56 shrink-0 sticky left-0 bg-white dark:bg-slate-900 z-40 border-r border-slate-100 dark:border-slate-800"></div>
                                            <div className="flex-1 flex">
                                                {years.map((y, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="border-l border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 py-1 px-3 bg-slate-50/50 dark:bg-slate-800/30 uppercase tracking-widest"
                                                        style={{ width: `${(y.monthCount / totalMonths) * 100}%` }}
                                                    >
                                                        {y.year}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Tier 2: Months */}
                                        <div className="flex h-10 items-center">
                                            <div className="w-56 shrink-0 font-bold text-slate-600 dark:text-slate-300 px-6 sticky left-0 bg-white dark:bg-slate-900 z-40 border-r border-slate-100 dark:border-slate-800 flex items-center">
                                                项目清单
                                            </div>
                                            <div className="flex-1 flex h-full">
                                                {Array.from({ length: totalMonths }).map((_, i) => {
                                                    const monthDate = addMonths(minDate, i);
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="flex-1 border-l border-slate-50 dark:border-slate-800/50 text-[11px] font-bold text-slate-500 flex items-center pl-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                                                        >
                                                            {format(monthDate, 'MM月')}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legend Section (Always visible below header) */}
                                    {keyTaskDefinitions.length > 0 && (
                                        <div className="flex flex-wrap gap-4 px-6 py-3 bg-slate-50/30 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800 sticky left-0 z-10" style={{ width: `calc(14rem + ${timelineWidth}px)` }}>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-center mr-2">战略任务图例:</span>
                                            {keyTaskDefinitions.map(def => (
                                                <div key={def.id} className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: def.color }}></div>
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{def.name}</span>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-2 ml-auto border-l border-slate-200 dark:border-slate-700 pl-4">
                                                <div className="w-3 h-0.5 bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.5)]"></div>
                                                <span className="text-[11px] font-bold text-red-500">今日位置</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Project Rows Area */}
                                    <div className="relative pt-4 pb-8">
                                        {/* Global Vertical Grid Lines */}
                                        <div className="absolute inset-0 pointer-events-none z-0">
                                            <div className="flex h-full ml-56">
                                                {Array.from({ length: totalMonths }).map((_, i) => (
                                                    <div key={i} className="flex-1 border-l border-dashed border-slate-100 dark:border-slate-800/50" />
                                                ))}
                                            </div>
                                            {/* Today Line */}
                                            {todayLeft >= 0 && todayLeft <= 100 && (
                                                <div
                                                    className="absolute top-0 bottom-0 w-[2px] bg-red-400/40 dark:bg-red-500/20 z-20"
                                                    style={{ left: `calc(14rem + ${todayLeft}%)` }}
                                                >
                                                    <div className="w-full h-full border-l-2 border-dotted border-red-500/50" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Rows */}
                                        <div className="space-y-4 px-0">
                                            {validProjectsForGantt.sort((a, b) => (a.rank || 99) - (b.rank || 99)).map(project => {
                                                const start = parseISO(project.startDate);
                                                const end = parseISO(project.endDate);
                                                const offset = differenceInDays(start, minDate);
                                                const duration = differenceInDays(end, start);

                                                const left = (offset / totalDays) * 100;
                                                const width = (duration / totalDays) * 100;

                                                const colorClass =
                                                    project.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
                                                        project.status === 'planning' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                                            project.status === 'completed' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600' : 'bg-gradient-to-r from-orange-400 to-amber-500';

                                                return (
                                                    <div key={project.id} className="flex items-center group relative z-10 py-1.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all rounded-r-xl">
                                                        {/* Sticky Left Column */}
                                                        <div className="w-56 shrink-0 px-6 sticky left-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 border-r border-slate-100 dark:border-slate-800 flex items-center gap-3 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.05)]">
                                                            <div className={`w-2 h-2 rounded-full shrink-0 ${project.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : project.status === 'completed' ? 'bg-purple-500' : 'bg-slate-300'} ${project.status === 'active' ? 'animate-pulse' : ''}`}></div>
                                                            <div className="min-w-0">
                                                                <div
                                                                    className="font-black text-[13px] text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors cursor-pointer"
                                                                    onClick={() => navigate(`/projects/${project.id}`)}
                                                                >
                                                                    {project.name}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="neutral" className="text-[9px] py-0 px-1 border-none bg-slate-100 dark:bg-slate-800 font-bold opacity-60">
                                                                        PK:{project.rank}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-slate-400 font-black tracking-tighter">
                                                                        {format(start, 'MM/dd')} » {format(end, 'MM/dd')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Bar Column */}
                                                        <div className="flex-1 relative h-12 flex items-center">
                                                            <div
                                                                className={`absolute h-8 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-hover:shadow-[0_8px_20px_rgba(37,99,235,0.2)] transition-all cursor-pointer flex items-center px-3 group/bar overflow-hidden ${project.keyTasks && project.keyTasks.length > 0 ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700' : colorClass}`}
                                                                style={{ left: `${left}%`, width: `${width}%` }}
                                                                onClick={() => handleOpenModal(project)}
                                                            >
                                                                {project.keyTasks && project.keyTasks.length > 0 ? (
                                                                    <div className="absolute inset-0 p-0.5">
                                                                        {project.keyTasks.map((kt, idx) => {
                                                                            const ktDef = keyTaskDefinitions.find(d => d.id === kt.definitionId);
                                                                            if (!ktDef) return null;

                                                                            const pStart = parseISO(project.startDate).getTime();
                                                                            const pEnd = parseISO(project.endDate).getTime();
                                                                            const ktStart = parseISO(kt.startDate).getTime();
                                                                            const ktEnd = parseISO(kt.endDate).getTime();

                                                                            const pTotal = pEnd - pStart;
                                                                            const ktLeft = Math.max(0, ((ktStart - pStart) / pTotal) * 100);
                                                                            const ktWidth = Math.min(100 - ktLeft, ((ktEnd - ktStart) / pTotal) * 100);

                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="absolute top-0.5 bottom-0.5 rounded-md flex items-center justify-center overflow-hidden border border-white/40 shadow-sm backdrop-blur-[2px] transition-all hover:scale-[1.05] hover:z-30 z-10"
                                                                                    style={{
                                                                                        backgroundColor: ktDef.color,
                                                                                        left: `${ktLeft}%`,
                                                                                        width: `${ktWidth}%`,
                                                                                    }}
                                                                                >
                                                                                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                                                                                    <span className="text-[10px] text-white font-black truncate px-1.5 leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] pointer-events-none uppercase tracking-tighter">
                                                                                        {ktDef.name}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className="absolute top-0 left-0 h-full bg-white/20 pointer-events-none transition-all duration-700" style={{ width: `${project.progress || 0}%` }} />
                                                                        <div className="relative z-10 w-full flex items-center justify-between gap-2 overflow-hidden">
                                                                            <span className="text-[12px] text-white font-black truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                                                                                {project.name}
                                                                            </span>
                                                                            <span className="text-[10px] text-white/90 font-black bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10 shrink-0">
                                                                                {project.progress || 0}%
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </Card>
            )
            }

            <KeyTaskSettingsModal
                isOpen={isKeyTaskSettingsOpen}
                onClose={() => setIsKeyTaskSettingsOpen(false)}
            />

            {/* Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Project' : 'New Project'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.category')}</label>
                                            <select
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                            >
                                                <option value="web">Web 应用</option>
                                                <option value="mobile">移动应用</option>
                                                <option value="data">数据分析</option>
                                                <option value="infrastructure">基础设施</option>
                                                <option value="custom">自定义</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.department')}</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.department}
                                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                placeholder="输入负责部门"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.budget')} (¥)</label>
                                            <input
                                                type="number"
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.budget}
                                                onChange={e => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.status')}</label>
                                            <select
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                            >
                                                <option value="planning">Planning</option>
                                                <option value="active">Active</option>
                                                <option value="on-hold">On Hold</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.startDate')}</label>
                                            <input
                                                type="date"
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('projects.endDate')}</label>
                                            <input
                                                type="date"
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.endDate}
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Resource Requirements */}
                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-slate-800">Resource Requirements</h3>
                                        <button type="button" onClick={addResourceReq} className="text-sm text-blue-600 font-bold hover:underline">+ Add Requirement</button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.resourceRequirements?.map((req, index) => (
                                            <div key={index} className="flex gap-3 items-end bg-slate-50 p-3 rounded-xl">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-slate-500">Resource</label>
                                                    <select
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={req.resourceId}
                                                        onChange={e => updateResourceReq(index, 'resourceId', e.target.value)}
                                                    >
                                                        {resourcePool.map(r => (
                                                            <option key={r.id} value={r.id}>{r.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-xs font-bold text-slate-500">Count</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={req.count}
                                                        onChange={e => updateResourceReq(index, 'count', parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-xs font-bold text-slate-500">Duration</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={req.duration}
                                                        onChange={e => updateResourceReq(index, 'duration', parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-xs font-bold text-slate-500">Unit</label>
                                                    <select
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={req.unit}
                                                        onChange={e => updateResourceReq(index, 'unit', e.target.value)}
                                                    >
                                                        <option value="day">Days</option>
                                                        <option value="month">Months</option>
                                                        <option value="year">Years</option>
                                                    </select>
                                                </div>
                                                <button type="button" onClick={() => removeResourceReq(index)} className="p-2 text-slate-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.resourceRequirements?.length === 0 && (
                                            <p className="text-sm text-slate-400 italic">No resources allocated yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Milestones */}
                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-slate-800">Project Milestones</h3>
                                        <button type="button" onClick={addMilestone} className="text-sm text-blue-600 font-bold hover:underline">+ Add Milestone</button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.milestones?.map((m, index) => (
                                            <div key={index} className="flex gap-3 items-end bg-slate-50 p-3 rounded-xl">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-slate-500">Milestone Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Design Review"
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={m.name}
                                                        onChange={e => updateMilestone(index, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-48">
                                                    <label className="text-xs font-bold text-slate-500">Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                        value={m.date}
                                                        onChange={e => updateMilestone(index, 'date', e.target.value)}
                                                    />
                                                </div>
                                                <button type="button" onClick={() => removeMilestone(index)} className="p-2 text-slate-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.milestones?.length === 0 && (
                                            <p className="text-sm text-slate-400 italic">No milestones defined.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Key Tasks for Timeline */}
                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-slate-800">关键任务 (甘特图展示)</h3>
                                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">预览可用</span>
                                        </div>
                                        <button type="button" onClick={addKeyTask} className="text-sm text-blue-600 font-bold hover:underline">+ 添加关键任务</button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.keyTasks?.map((kt, index) => (
                                            <div key={index} className="flex gap-3 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-slate-500 mb-1 block">任务名称</label>
                                                    <select
                                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
                                                        value={kt.definitionId}
                                                        onChange={e => updateKeyTask(index, 'definitionId', e.target.value)}
                                                    >
                                                        {keyTaskDefinitions.map(def => (
                                                            <option key={def.id} value={def.id}>{def.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-1/4">
                                                    <label className="text-xs font-bold text-slate-500 mb-1 block">开始日期</label>
                                                    <input
                                                        type="date"
                                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
                                                        value={kt.startDate}
                                                        onChange={e => updateKeyTask(index, 'startDate', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-1/4">
                                                    <label className="text-xs font-bold text-slate-500 mb-1 block">结束日期</label>
                                                    <input
                                                        type="date"
                                                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm"
                                                        value={kt.endDate}
                                                        onChange={e => updateKeyTask(index, 'endDate', e.target.value)}
                                                    />
                                                </div>
                                                <button type="button" onClick={() => removeKeyTask(index)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        {(!formData.keyTasks || formData.keyTasks.length === 0) && (
                                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                                <p className="text-sm text-slate-400">暂未添加关键任务，甘特图将显示默认进度条</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Environment Requirements */}
                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-slate-800">Environment Resources</h3>
                                        <button type="button" onClick={addEnvReq} className="text-sm text-blue-600 font-bold hover:underline">+ Add Environment</button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.environmentRequirements?.map((req, index) => (
                                            <div key={index} className="flex flex-col gap-3 bg-slate-50 p-4 rounded-xl">
                                                <div className="flex gap-3 items-end">
                                                    <div className="flex-1">
                                                        <label className="text-xs font-bold text-slate-500">Environment</label>
                                                        <select
                                                            className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                            value={req.environmentId}
                                                            onChange={e => updateEnvReq(index, 'environmentId', e.target.value)}
                                                        >
                                                            {environmentResources.map(e => (
                                                                <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                                                            ))}
                                                            {environmentResources.length === 0 && <option disabled>No environments available</option>}
                                                        </select>
                                                    </div>
                                                    <div className="w-1/2">
                                                        <label className="text-xs font-bold text-slate-500">Purpose</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. UAT Testing"
                                                            className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                            value={req.purpose}
                                                            onChange={e => updateEnvReq(index, 'purpose', e.target.value)}
                                                        />
                                                    </div>
                                                    <button type="button" onClick={() => removeEnvReq(index)} className="p-2 text-slate-400 hover:text-red-600">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="flex-1">
                                                        <label className="text-xs font-bold text-slate-500">Start Date</label>
                                                        <input
                                                            type="date"
                                                            className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                            value={req.startDate}
                                                            onChange={e => updateEnvReq(index, 'startDate', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-xs font-bold text-slate-500">End Date</label>
                                                        <input
                                                            type="date"
                                                            className="w-full p-2 rounded-lg border border-slate-200 text-sm"
                                                            value={req.endDate}
                                                            onChange={e => updateEnvReq(index, 'endDate', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {formData.environmentRequirements?.length === 0 && (
                                            <p className="text-sm text-slate-400 italic">No environment resources requested.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Scoring Factors */}
                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-slate-800">Scoring Factors</h3>
                                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm">
                                            Predicted Score: {currentScore.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {factorDefinitions.map((factor) => (
                                            <div key={factor.id}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <label className="font-medium text-slate-600">{factor.name}</label>
                                                    <span className="font-bold text-blue-600">{formData.factors?.[factor.id] || 0}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="10"
                                                    step="1"
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    value={formData.factors?.[factor.id] || 0}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        factors: { ...prev.factors, [factor.id]: parseInt(e.target.value) }
                                                    }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors"
                                    >
                                        Save Project
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Template Selector */}
            {isTemplateSelectorOpen && (
                <TemplateSelector
                    templates={templates}
                    onSelect={handleTemplateSelect}
                    onClose={() => setIsTemplateSelectorOpen(false)}
                />
            )}
        </PageContainer>
    );
};

export default Projects;
