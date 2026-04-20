import { Repository } from 'typeorm';
import { Attachment, Card } from '../../database/entities';
import { ActivitiesService } from '../activities/activities.service';
export declare class AttachmentsService {
    private readonly attachmentRepository;
    private readonly cardRepository;
    private readonly activitiesService;
    private readonly logger;
    constructor(attachmentRepository: Repository<Attachment>, cardRepository: Repository<Card>, activitiesService: ActivitiesService);
    private cleanupFile;
    private validateCardExists;
    create(cardId: string, file: Express.Multer.File, userId?: string): Promise<Attachment>;
    findAllByCard(cardId: string): Promise<Attachment[]>;
    findOne(id: string): Promise<Attachment>;
    restore(id: string): Promise<Attachment>;
    remove(id: string): Promise<void>;
}
