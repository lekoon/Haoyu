import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { PmoModule } from './pmo/pmo.module';
import { ResourceModule } from './resource/resource.module';
import { TaskModule } from './task/task.module';
import { RiskModule } from './risk/risk.module';

@Module({
  imports: [PrismaModule, AuthModule, ProjectModule, PmoModule, ResourceModule, TaskModule, RiskModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
