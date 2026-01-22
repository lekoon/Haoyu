import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiskService {
    constructor(private prisma: PrismaService) { }

    async findAll(projectId: string) {
        return this.prisma.risk.findMany({
            where: { projectId },
            include: {
                owner: {
                    select: { id: true, name: true, avatar: true },
                },
            },
            orderBy: { riskScore: 'desc' },
        });
    }

    async findOne(id: string) {
        const risk = await this.prisma.risk.findUnique({
            where: { id },
            include: {
                owner: true,
            },
        });
        if (!risk) throw new NotFoundException(`Risk with ID ${id} not found`);
        return risk;
    }

    async create(data: any) {
        // Calculate risk score: probability * impact
        const riskScore = (data.probability || 0) * (data.impact || 0);

        return this.prisma.risk.create({
            data: {
                ...data,
                riskScore,
                identifiedDate: data.identifiedDate ? new Date(data.identifiedDate) : new Date(),
                resolvedDate: data.resolvedDate ? new Date(data.resolvedDate) : null,
            },
        });
    }

    async update(id: string, data: any) {
        const updateData = { ...data };

        if (data.probability !== undefined || data.impact !== undefined) {
            const current = await this.findOne(id);
            const prob = data.probability ?? current.probability;
            const imp = data.impact ?? current.impact;
            updateData.riskScore = prob * imp;
        }

        if (data.identifiedDate) updateData.identifiedDate = new Date(data.identifiedDate);
        if (data.resolvedDate) updateData.resolvedDate = new Date(data.resolvedDate);

        return this.prisma.risk.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string) {
        return this.prisma.risk.delete({ where: { id } });
    }

    async getRiskHeatmap(projectId: string) {
        const risks = await this.findAll(projectId);

        // Group risks by probability and impact for matrix visualization
        const matrix = Array(5).fill(0).map(() => Array(5).fill(0));

        risks.forEach(risk => {
            const p = Math.min(Math.max(risk.probability - 1, 0), 4);
            const i = Math.min(Math.max(risk.impact - 1, 0), 4);
            matrix[p][i]++;
        });

        return {
            projectId,
            matrix,
            totalCount: risks.length,
            highRisks: risks.filter(r => r.riskScore >= 15).length,
        };
    }
}
