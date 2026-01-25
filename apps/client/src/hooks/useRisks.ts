import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskService } from '../services/riskService';
import type { Risk } from '@haoyu/shared';
import { handleApiOperation } from '../utils/apiHandler';

export const useRisks = (projectId: string | undefined) => {
    const queryClient = useQueryClient();

    const risksQuery = useQuery({
        queryKey: ['risks', projectId],
        queryFn: async () => {
            return handleApiOperation<Risk[]>(
                async () => {
                    return await riskService.getRisks(projectId!);
                },
                'fetch risks',
                {
                    fallbackValue: [],
                    isDemoMode: true
                }
            );
        },
        enabled: !!projectId,
    });

    const heatmapQuery = useQuery({
        queryKey: ['risks', 'heatmap', projectId],
        queryFn: async () => {
            return handleApiOperation<any>(
                async () => {
                    return await riskService.getHeatmap(projectId!);
                },
                'fetch risk heatmap',
                {
                    fallbackValue: { high: 0, medium: 0, low: 0 },
                    isDemoMode: true
                }
            );
        },
        enabled: !!projectId,
    });

    const createRiskMutation = useMutation({
        mutationFn: async (risk: Partial<Risk>) => {
            return handleApiOperation<Risk>(
                async () => {
                    return await riskService.createRisk(risk);
                },
                'create risk',
                {
                    fallbackValue: { ...risk, id: `mock-risk-${Date.now()}` } as Risk,
                    isDemoMode: true
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const updateRiskMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Risk> }) => {
            return handleApiOperation<Risk>(
                async () => {
                    return await riskService.updateRisk(id, updates);
                },
                'update risk',
                {
                    fallbackValue: { id, ...updates } as Risk,
                    isDemoMode: true
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const deleteRiskMutation = useMutation({
        mutationFn: async (id: string) => {
            return handleApiOperation<void>(
                async () => {
                    return await riskService.deleteRisk(id);
                },
                'delete risk',
                {
                    fallbackValue: undefined,
                    isDemoMode: true
                }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    return {
        risks: risksQuery.data || [],
        heatmap: heatmapQuery.data,
        isLoading: risksQuery.isLoading && !risksQuery.data, // Only loading if no data
        createRisk: createRiskMutation.mutate,
        updateRisk: updateRiskMutation.mutate,
        deleteRisk: deleteRiskMutation.mutate,
    };
};
