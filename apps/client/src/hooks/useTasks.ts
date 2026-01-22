import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';
import type { Task } from '@haoyu/shared';

export const useTasks = (projectId: string | undefined) => {
    const queryClient = useQueryClient();

    const tasksQuery = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: () => taskService.getTasks(projectId!),
        enabled: !!projectId,
    });

    const taskTreeQuery = useQuery({
        queryKey: ['tasks', 'tree', projectId],
        queryFn: () => taskService.getTaskTree(projectId!),
        enabled: !!projectId,
    });

    const createTaskMutation = useMutation({
        mutationFn: (task: Partial<Task>) => taskService.createTask(task),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
            taskService.updateTask(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (id: string) => taskService.deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    const syncTaskTreeMutation = useMutation({
        mutationFn: (tasks: any[]) => taskService.syncTaskTree(projectId!, tasks),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });

    return {
        tasks: tasksQuery.data || [],
        taskTree: taskTreeQuery.data || [],
        isLoading: tasksQuery.isLoading || taskTreeQuery.isLoading,
        createTask: createTaskMutation.mutate,
        updateTask: updateTaskMutation.mutate,
        deleteTask: deleteTaskMutation.mutate,
        syncTaskTree: syncTaskTreeMutation.mutate,
    };
};
