import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig, jwtConfig } from './config';
import { User, Workspace, WorkspaceMember, Board, BoardMember, List, Card, Label, Checklist, ChecklistItem, Attachment, Comment, ActivityLog } from './database/entities';
import { UsersModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { WorkspacesModule } from './modules/workspaces';
import { BoardsModule } from './modules/boards';
import { ListsModule } from './modules/lists';
import { CardsModule } from './modules/cards';
import { LabelsModule } from './modules/labels';
import { ChecklistsModule } from './modules/checklists';
import { AttachmentsModule } from './modules/attachments';
import { CommentsModule } from './modules/comments';
import { ActivitiesModule } from './modules/activities';
import { SearchModule } from './modules/search';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
      envFilePath: ['.env', 'backend/.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [User, Workspace, WorkspaceMember, Board, BoardMember, List, Card, Label, Checklist, ChecklistItem, Attachment, Comment, ActivityLog],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    WorkspacesModule,
    BoardsModule,
    ListsModule,
    CardsModule,
    LabelsModule,
    ChecklistsModule,
    AttachmentsModule,
    CommentsModule,
    ActivitiesModule,
    SearchModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

