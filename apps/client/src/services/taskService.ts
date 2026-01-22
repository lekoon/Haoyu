import apiClient from './apiClient';
import type { Task } from '@haoyu/shared';

export const taskService = {
    getTasks: async (projectId: string) => {
        const { data } = await apiClient.get<Task[]>(`/tasks?projectId=${projectId}`);
        return data;
    },

    getTaskTree: async (projectId: string) => {
        const { data } = await apiClient.get<Task[]>(`/tasks/tree?projectId=${projectId}`);
        return data;
    },

    createTask: async (task: Partial<Task>) => {
        const { data } = await apiClient.post<Task>('/tasks', task);
        return data;
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
        const { data } = await apiClient.put<Task>(`/tasks/${id}`, updates);
        return data;
    },

    deleteTask: async (id: string) => {
        await apiClient.delete(`/tasks/${id}`);
    },

    syncTaskTree: async (projectId: string, tasks: any[]) => {
        const { data } = await apiClient.post(`/tasks/sync/${projectId}`, tasks);
        return data;
    },
};
