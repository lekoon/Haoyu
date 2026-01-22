import { Controller, Post, Get, UseGuards, Param } from '@nestjs/common';
import { PmoService } from './pmo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pmo')
@UseGuards(JwtAuthGuard)
export class PmoController {
    constructor(private readonly pmoService: PmoService) { }

    @Post('sync')
    async syncDecisionLogic() {
        await this.pmoService.syncAllScoresAndRanks();
        return { message: 'PMO decision logic synced successfully' };
    }

    @Get('health')
    async getHealth() {
        return { status: 'ok', service: 'PMO Decision Engine' };
    }

    @Get('scope-metrics/:projectId')
    async getScopeMetrics(@Param('projectId') projectId: string) {
        return this.pmoService.getScopeCreepMetrics(projectId);
    }

    @Get('ghost-tasks/:projectId')
    async getGhostTasks(@Param('projectId') projectId: string) {
        return this.pmoService.detectGhostTasks(projectId);
    }
}
