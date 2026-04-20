import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { Comment } from '../../database/entities';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    create(cardId: string, createCommentDto: CreateCommentDto, userId: string): Promise<Comment>;
    findAllByCard(cardId: string): Promise<Comment[]>;
    update(id: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<Comment>;
    remove(id: string, userId: string): Promise<void>;
}
