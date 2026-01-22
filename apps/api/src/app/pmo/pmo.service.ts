import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PmoService {
    constructor(private prisma: PrismaService) { }

    async calculateProjectScore(projectId: string): Promise<number> {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project || !project.factors) return 0;

        const definitions = await this.prisma.factorDefinition.findMany();
        const projectFactors = project.factors as Record<string, number>;

        let totalScore = 0;
        let totalWeight = 0;

        definitions.forEach((def) => {
            const score = projectFactors[def.id] || 0;
            totalScore += score * def.weight;
            totalWeight += def.weight;
        });

        const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

        await this.prisma.project.update({
            where: { id: projectId },
            data: { score: finalScore },
        });

        return finalScore;
    }

    async rankAllProjects(): Promise<void> {
        const projects = await this.prisma.project.findMany({
            orderBy: { score: 'desc' },
        });

        const updates = projects.map((p, index) =>
            this.prisma.project.update({
                where: { id: p.id },
                data: { rank: index + 1 },
            }),
        );

        await Promise.all(updates);
    }

    async syncAllScoresAndRanks(): Promise<void> {
        const projects = await this.prisma.project.findMany();
        const definitions = await this.prisma.factorDefinition.findMany();

        for (const project of projects) {
            if (!project.factors) continue;
            const projectFactors = project.factors as Record<string, number>;

            let totalScore = 0;
            let totalWeight = 0;

            definitions.forEach((def) => {
                const score = projectFactors[def.id] || 0;
                totalScore += score * def.weight;
                totalWeight += def.weight;
            });

            const score = totalWeight > 0 ? totalScore / totalWeight : 0;
            await this.prisma.project.update({
                where: { id: project.id },
                data: { score },
            });
        }

        await this.rankAllProjects();
    }

    async getScopeCreepMetrics(projectId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                tasks: true,
                changeRequests: true,
            },
        });

        if (!project) return null;

        const calculateTotalEffort = (tasks: any[]) => {
            return tasks.reduce((total, task) => {
                const start = new Date(task.startDate);
                const end = new Date(task.endDate);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                return total + days * 8;
            }, 0);
        };

        const currentEffort = calculateTotalEffort(project.tasks);
        const baselineEffort = currentEffort; // Placeholder for now

        const creepPercentage = baselineEffort > 0 ? ((currentEffort - baselineEffort) / baselineEffort) * 100 : 0;

        return {
            projectId: project.id,
            projectName: project.name,
            currentEffort,
            baselineEffort,
            creepPercentage,
            isOverThreshold: creepPercentage > 30,
            changeRequestsCount: project.changeRequests.length,
        };
    }

    async detectGhostTasks(projectId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                tasks: true,
                requirements: true,
            },
        });

        if (!project) return [];

        const requirements = project.requirements;
        const allTaskIdsInRequirements = new Set(
            requirements.flatMap((req: any) => (req.relatedTaskIds as string[]) || [])
        );

        const ghostTasks = project.tasks
            .filter((task) => !allTaskIdsInRequirements.has(task.id))
            .map((task) => ({
                taskId: task.id,
                taskName: task.name,
                reason: 'no_requirement_link',
            }));

        return ghostTasks;
    }
}
