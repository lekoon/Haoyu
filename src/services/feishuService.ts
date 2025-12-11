import { Project, ResourcePoolItem, Task } from '../types';

export interface FeishuConfig {
    appId: string;
    appSecret: string;
}

export interface FeishuSyncResult {
    success: boolean;
    projectsSynced: number;
    tasksSynced: number;
    resourcesSynced: number;
    errors: string[];
}

// Simulated Feishu Data Structure
interface FeishuBaseSheet {
    spreadsheetToken: string;
}

// Mock Data for demonstration
const MOCK_FEISHU_PROJECTS = [
    {
        id: 'fs-proj-001',
        fields: {
            name: '[来自飞书] 企业数字化转型一期',
            status: 'In Progress',
            priority: 'P0',
            start_date: '2025-01-01',
            end_date: '2025-06-30',
            manager: '张三'
        }
    },
    {
        id: 'fs-proj-002',
        fields: {
            name: '[来自飞书] 移动端体验升级',
            status: 'Planning',
            priority: 'P1',
            start_date: '2025-03-01',
            end_date: '2025-05-30',
            manager: '李四'
        }
    }
];

const MOCK_FEISHU_RESOURCES = [
    {
        id: 'fs-res-001',
        fields: {
            name: '王五',
            role: 'Senior Engineer',
            department: '研发部',
            email: 'wangwu@example.com'
        }
    },
    {
        id: 'fs-res-002',
        fields: {
            name: '赵六',
            role: 'Product Manager',
            department: '产品部',
            email: 'zhaoliu@example.com'
        }
    }
];

export const syncFeishuData = async (config: FeishuConfig): Promise<FeishuSyncResult> => {
    // In a real application, this would:
    // 1. Get tenant_access_token using appId & appSecret
    // 2. Call Feishu Open API (Base or multidimensional tables)
    // 3. Transform data

    console.log(`Starting sync with App ID: ${config.appId}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!config.appId.startsWith('cli_')) {
        return {
            success: false,
            projectsSynced: 0,
            tasksSynced: 0,
            resourcesSynced: 0,
            errors: ['无效的 App ID 格式，请以 cli_ 开头']
        };
    }

    // Transform Mock Data into Visorq Format
    const newProjects: Project[] = MOCK_FEISHU_PROJECTS.map(p => ({
        id: p.id,
        name: p.fields.name,
        description: `Synced from Feishu (Manager: ${p.fields.manager})`,
        status: p.fields.status === 'In Progress' ? 'active' : 'planning',
        startDate: p.fields.start_date,
        endDate: p.fields.end_date,
        budget: 500000,
        spent: 0,
        priority: p.fields.priority as any,
        managerId: 'admin', // Default mapping
        tags: ['Feishu', 'Imported'],
        progress: 0,
        health: {
            overall: 100,
            schedule: 100,
            budget: 100,
            scope: 100,
            resources: 100,
            risk: 100,
            teamMood: 100
        },
        info: {
            tasks: [],
            risks: [],
            milestones: []
        },
        resourceRequirements: [],
        score: 85
    }));

    const newResources: ResourcePoolItem[] = MOCK_FEISHU_RESOURCES.map(r => ({
        id: r.id,
        name: r.fields.name,
        role: r.fields.role,
        department: r.fields.department,
        email: r.fields.email,
        skills: [{ name: 'Feishu User', level: 3 }],
        availability: 100,
        efficiency: 1.0,
        costRate: 1000,
        totalQuantity: 1,
        assignedProjects: []
    }));

    // In a real app, we would dispatch these to the store here or return them
    // For this service, we'll return the parsed data and let the component update the store

    // Storing in a temporary global variable or custom event could be one way, 
    // but better to return data. 
    // However, the interface defined above just returns stats. 
    // Let's attach data to the result for the caller to handle.

    return {
        success: true,
        projectsSynced: newProjects.length,
        tasksSynced: 0,
        resourcesSynced: newResources.length,
        errors: [],
        // @ts-ignore - attaching data for the caller
        data: {
            projects: newProjects,
            resources: newResources
        }
    };
};
