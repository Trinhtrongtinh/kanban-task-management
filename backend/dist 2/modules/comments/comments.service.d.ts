import { Repository } from 'typeorm';
import { Comment, Card, BoardMember } from '../../database/entities';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { CommentsGateway } from './comments.gateway';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailerService } from '../notifications/mailer.service';
export declare class CommentsService {
    private readonly commentRepository;
    private readonly cardRepository;
    private readonly boardMemberRepository;
    private readonly commentsGateway;
    private readonly activitiesService;
    private readonly notificationsService;
    private readonly mailerService;
    constructor(commentRepository: Repository<Comment>, cardRepository: Repository<Card>, boardMemberRepository: Repository<BoardMember>, commentsGateway: CommentsGateway, activitiesService: ActivitiesService, notificationsService: NotificationsService, mailerService: MailerService);
    private getCardWithList;
    private validateCardExists;
    create(cardId: string, createCommentDto: CreateCommentDto, userId: string): Promise<Comment>;
    findAllByCard(cardId: string): Promise<Comment[]>;
    findOne(id: string): Promise<Comment>;
    private validateCommentPermission;
    update(id: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<Comment>;
    remove(id: string, userId: string): Promise<void>;
}
