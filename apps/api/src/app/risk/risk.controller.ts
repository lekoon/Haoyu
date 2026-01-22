import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import { RiskService } from './risk.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('risks')
@UseGuards(JwtAuthGuard)
export class RiskController {
    constructor(private readonly riskService: RiskService) { }

    @Get()
    async findAll(@Query('projectId') projectId: string) {
        return this.riskService.findAll(projectId);
    }

    @Get('heatmap')
    async getHeatmap(@Query('projectId') projectId: string) {
        return this.riskService.getRiskHeatmap(projectId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.riskService.findOne(id);
    }

    @Post()
    async create(@Body() data: any) {
        return this.riskService.create(data);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.riskService.update(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.riskService.remove(id);
    }
}
