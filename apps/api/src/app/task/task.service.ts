import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskService {
    constructor(private prisma: PrismaService) { }

    async findAll(projectId: string) {
        return this.prisma.task.findMany({
            where: { projectId },
            include: {
                assignee: {
                    select: { id: true, name: true, avatar: true },
                },
            },
            orderBy: { startDate: 'asc' },
        });
    }

    async findOne(id: string) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                children: true,
                assignee: true,
            },
        });
        if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
        return task;
    }

    async create(data: any) {
        return this.prisma.task.create({
            data: {
                ...data,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            },
        });
    }

    async update(id: string, data: any) {
        const updateData = { ...data };
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);

        return this.prisma.task.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string) {
        return this.prisma.task.delete({ where: { id } });
    }

    /**
     * 批量同步甘特图任务树
     * 用于处理拖拽、批量移动或依赖更新
     */
    async syncTaskTree(projectId: string, tasks: any[]) {
        const operations = tasks.map((task) => {
            const { id, ...data } = task;

            // 准备更新数据，确保日期格式正确
            const updateData: any = {
                ...data,
            };
            if (data.startDate) updateData.startDate = new Date(data.startDate);
            if (data.endDate) updateData.endDate = new Date(data.endDate);

            return this.prisma.task.upsert({
                where: { id: id.startsWith('temp-') ? '00000000-0000-0000-0000-000000000000' : id },
                update: updateData,
                create: {
                    ...updateData,
                    projectId,
                },
            });
        });

        return this.prisma.$transaction(operations);
    }

    /**
     * 递归获取任务树结构（为甘特图优化）
     */
    async getTaskTree(projectId: string) {
        const allTasks = await this.findAll(projectId);

        const buildTree = (parentId: string | null = null): any[] => {
            return allTasks
                .filter((t) => t.parentId === parentId)
                .map((t) => ({
                    ...t,
                    children: buildTree(t.id),
                }));
        };

        return buildTree();
    }
}
