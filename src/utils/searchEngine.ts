import type { Project, ResourcePoolItem, Task, ProjectTemplate } from '../types';

export type SearchResultType = 'project' | 'task' | 'resource' | 'template' | 'page';

export interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
    path: string; // URL path to navigate to
    matchScore: number;
    tags?: string[];
}

export const searchProjects = (projects: Project[], query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();

    return projects
        .filter(p => p.name.toLowerCase().includes(lowerQuery) || p.description.toLowerCase().includes(lowerQuery))
        .map(p => ({
            id: p.id,
            type: 'project',
            title: p.name,
            subtitle: `Status: ${p.status} | Priority: ${p.priority || 'N/A'}`,
            path: `/projects/${p.id}`,
            matchScore: p.name.toLowerCase().indexOf(lowerQuery) === 0 ? 10 : 5,
            tags: [p.status as string]
        }));
};

export const searchResources = (resources: ResourcePoolItem[], query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();

    return resources
        .filter(r => r.name.toLowerCase().includes(lowerQuery) || (r.role && r.role.toLowerCase().includes(lowerQuery)) || r.skills?.some(s => s.name.toLowerCase().includes(lowerQuery)))
        .map(r => ({
            id: r.id,
            type: 'resource',
            title: r.name,
            subtitle: `${r.role || 'Resource'} | ${r.skills?.map(s => s.name).join(', ') || 'No skills'}`,
            path: `/resources`, // Linking to resource page generally, maybe query param later
            matchScore: r.name.toLowerCase().indexOf(lowerQuery) === 0 ? 10 : 5,
            tags: r.skills?.map(s => s.name)
        }));
};

export const searchTasks = (projects: Project[], query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    projects.forEach(project => {
        if (!project.info?.tasks) return;

        project.info.tasks.forEach(task => {
            if (task.name.toLowerCase().includes(lowerQuery)) {
                results.push({
                    id: task.id,
                    type: 'task',
                    title: task.name,
                    subtitle: `In Project: ${project.name} | Status: ${task.status}`,
                    path: `/projects/${project.id}`, // Navigate to project
                    matchScore: task.name.toLowerCase().indexOf(lowerQuery) === 0 ? 8 : 4,
                    tags: [task.status]
                });
            }
        });
    });

    return results;
};

export const searchTemplates = (templates: ProjectTemplate[], query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();

    return templates
        .filter(t => t.name.toLowerCase().includes(lowerQuery))
        .map(t => ({
            id: t.id,
            type: 'template',
            title: t.name,
            subtitle: t.description,
            path: `/projects/templates`,
            matchScore: 5,
            tags: [t.category]
        }));
};

export const searchPages = (query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();
    const pages = [
        { name: 'Dashboard', path: '/dashboard', description: 'Overview and KPIs' },
        { name: 'Projects', path: '/projects', description: 'All projects list' },
        { name: 'Resources', path: '/resources', description: 'Resource pool and planning' },
        { name: 'Cost Analysis', path: '/analysis', description: 'Financial reports' },
        { name: 'Settings', path: '/settings', description: 'System configuration' },
        { name: 'AI Decision', path: '/ai-decision', description: 'AI insights' }
    ];

    return pages
        .filter(p => p.name.toLowerCase().includes(lowerQuery) || p.description.toLowerCase().includes(lowerQuery))
        .map(p => ({
            id: p.path,
            type: 'page',
            title: p.name,
            subtitle: p.description,
            path: p.path,
            matchScore: p.name.toLowerCase().indexOf(lowerQuery) === 0 ? 15 : 7
        }));
};

export const aggregateSearch = (
    query: string,
    data: {
        projects: Project[],
        resources: ResourcePoolItem[],
        templates: ProjectTemplate[]
    }
): SearchResult[] => {
    if (!query || query.length < 1) return [];

    const results = [
        ...searchPages(query),
        ...searchProjects(data.projects, query),
        ...searchResources(data.resources, query),
        ...searchTasks(data.projects, query),
        ...searchTemplates(data.templates, query)
    ];

    // Sort by match score then alphabetically
    return results.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
        }
        return a.title.localeCompare(b.title);
    }).slice(0, 20); // Limit to 20 results
};
