import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Project } from '@haoyu/shared';
import { PmoService } from '../pmo/pmo.service';

@Injectable()
export class ProjectService {
    constructor(
        private prisma: PrismaService,
        private pmoService: PmoService
    ) { }

    async findAll() {
        return this.prisma.project.findMany({
            include: { manager: { select: { name: true, username: true } } },
            orderBy: { score: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.project.findUnique({
            where: { id },
            include: { tasks: true, risks: true, milestones: true },
        });
    }

    async create(data: any) {
        const project = await this.prisma.project.create({ data });
        await this.pmoService.calculateProjectScore(project.id);
        await this.pmoService.rankAllProjects();
        return this.findOne(project.id);
    }

    async update(id: string, data: any) {
        const project = await this.prisma.project.update({
            where: { id },
            data,
        });
        if (data.factors) {
            await this.pmoService.calculateProjectScore(id);
            await this.pmoService.rankAllProjects();
        }
        return this.findOne(id);
    }

    async remove(id: string) {
        return this.prisma.project.delete({ where: { id } });
    }
}
