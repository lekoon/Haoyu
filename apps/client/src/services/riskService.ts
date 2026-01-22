import apiClient from './apiClient';
import type { Risk } from '@haoyu/shared';

export const riskService = {
    getRisks: async (projectId: string) => {
        const { data } = await apiClient.get<Risk[]>(`/risks?projectId=${projectId}`);
        return data;
    },

    getHeatmap: async (projectId: string) => {
        const { data } = await apiClient.get<any>(`/risks/heatmap?projectId=${projectId}`);
        return data;
    },

    createRisk: async (risk: Partial<Risk>) => {
        const { data } = await apiClient.post<Risk>('/risks', risk);
        return data;
    },

    updateRisk: async (id: string, updates: Partial<Risk>) => {
        const { data } = await apiClient.put<Risk>(`/risks/${id}`, updates);
        return data;
    },

    deleteRisk: async (id: string) => {
        await apiClient.delete(`/risks/${id}`);
    },
};
