import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskService } from '../services/riskService';
import type { Risk } from '@haoyu/shared';

export const useRisks = (projectId: string | undefined) => {
    const queryClient = useQueryClient();

    const risksQuery = useQuery({
        queryKey: ['risks', projectId],
        queryFn: () => riskService.getRisks(projectId!),
        enabled: !!projectId,
    });

    const heatmapQuery = useQuery({
        queryKey: ['risks', 'heatmap', projectId],
        queryFn: () => riskService.getHeatmap(projectId!),
        enabled: !!projectId,
    });

    const createRiskMutation = useMutation({
        mutationFn: (risk: Partial<Risk>) => riskService.createRisk(risk),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const updateRiskMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Risk> }) =>
            riskService.updateRisk(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const deleteRiskMutation = useMutation({
        mutationFn: (id: string) => riskService.deleteRisk(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    return {
        risks: risksQuery.data || [],
        heatmap: heatmapQuery.data,
        isLoading: risksQuery.isLoading || heatmapQuery.isLoading,
        createRisk: createRiskMutation.mutate,
        updateRisk: updateRiskMutation.mutate,
        deleteRisk: deleteRiskMutation.mutate,
    };
};
