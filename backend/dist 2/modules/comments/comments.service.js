"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const exceptions_1 = require("../../common/exceptions");
const enums_1 = require("../../common/enums");
const comments_gateway_1 = require("./comments.gateway");
const activities_service_1 = require("../activities/activities.service");
const notifications_service_1 = require("../notifications/notifications.service");
const mailer_service_1 = require("../notifications/mailer.service");
let CommentsService = class CommentsService {
    commentRepository;
    cardRepository;
    boardMemberRepository;
    commentsGateway;
    activitiesService;
    notificationsService;
    mailerService;
    constructor(commentRepository, cardRepository, boardMemberRepository, commentsGateway, activitiesService, notificationsService, mailerService) {
        this.commentRepository = commentRepository;
        this.cardRepository = cardRepository;
        this.boardMemberRepository = boardMemberRepository;
        this.commentsGateway = commentsGateway;
        this.activitiesService = activitiesService;
        this.notificationsService = notificationsService;
        this.mailerService = mailerService;
    }
    async getCardWithList(cardId) {
        const card = await this.cardRepository.findOne({
            where: { id: cardId },
            relations: ['list', 'list.board'],
        });
        if (!card) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return card;
    }
    async validateCardExists(cardId) {
        const card = await this.cardRepository.findOne({
            where: { id: cardId },
        });
        if (!card) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.CARD_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async create(cardId, createCommentDto, userId) {
        const card = await this.getCardWithList(cardId);
        const comment = this.commentRepository.create({
            cardId,
            userId,
            content: createCommentDto.content,
        });
        const savedComment = await this.commentRepository.save(comment);
        const commentWithUser = await this.findOne(savedComment.id);
        const requestedMentionIds = createCommentDto.mentionedUserIds || [];
        const candidateMentionIds = requestedMentionIds.filter((mentionedUserId) => mentionedUserId !== userId);
        let mentionedBoardMembers = [];
        if (createCommentDto.mentionAll || candidateMentionIds.length > 0) {
            mentionedBoardMembers = await this.boardMemberRepository.find({
                where: createCommentDto.mentionAll
                    ? {
                        boardId: card.list.boardId,
                    }
                    : {
                        boardId: card.list.boardId,
                        userId: (0, typeorm_2.In)(candidateMentionIds),
                    },
                relations: ['user'],
            });
            mentionedBoardMembers = mentionedBoardMembers.filter((member, index, members) => member.userId !== userId &&
                members.findIndex((candidate) => candidate.userId === member.userId) === index);
            for (const mentionedMember of mentionedBoardMembers) {
                const mentionLink = `/b/${card.list.boardId}?cardId=${cardId}&focus=activity&commentId=${commentWithUser.id}`;
                await this.notificationsService
                    .create({
                    userId: mentionedMember.userId,
                    cardId,
                    type: entities_1.NotificationType.MENTION,
                    title: 'Bạn được nhắc đến trong bình luận',
                    message: `${commentWithUser.user.username} đã nhắc đến bạn trong thẻ "${card.title}"`,
                    link: mentionLink,
                    metadata: {
                        boardId: card.list.boardId,
                        cardId,
                        commentId: commentWithUser.id,
                        fromUserId: userId,
                    },
                })
                    .catch(() => null);
                if (mentionedMember.user?.email && mentionedMember.user.notifyMentionEmail) {
                    this.mailerService
                        .sendMentionNotification(mentionedMember.user.email, mentionedMember.user.username || mentionedMember.user.email, commentWithUser.user.username || 'Một người dùng', card.title, card.list.board?.title || 'Kanban', commentWithUser.content, mentionLink)
                        .catch(() => null);
                }
            }
        }
        this.commentsGateway.emitCommentCreated(cardId, commentWithUser);
        const mentionText = mentionedBoardMembers.length
            ? ` (nhắc đến ${mentionedBoardMembers
                .map((member) => `@${member.user?.username || member.userId}`)
                .join(', ')})`
            : '';
        await this.activitiesService.createLog({
            userId,
            boardId: card.list.boardId,
            cardId: card.id,
            action: enums_1.ActivityAction.COMMENT_ADDED,
            entityTitle: card.title,
            details: {
                commentId: commentWithUser.id,
                mentionedUserIds: mentionedBoardMembers.map((member) => member.userId),
            },
            content: `Đã thêm một bình luận vào Card "${card.title}"${mentionText}`,
        });
        return commentWithUser;
    }
    async findAllByCard(cardId) {
        await this.validateCardExists(cardId);
        return this.commentRepository.find({
            where: { cardId },
            relations: ['user'],
            order: { createdAt: 'ASC' },
            select: {
                id: true,
                cardId: true,
                userId: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                },
            },
        });
    }
    async findOne(id) {
        const comment = await this.commentRepository.findOne({
            where: { id },
            relations: ['user'],
            select: {
                id: true,
                cardId: true,
                userId: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                },
            },
        });
        if (!comment) {
            throw new exceptions_1.BusinessException(enums_1.ErrorCode.COMMENT_NOT_FOUND, common_1.HttpStatus.NOT_FOUND);
        }
        return comment;
    }
    async validateCommentPermission(comment, userId) {
        if (comment.userId === userId) {
            return;
        }
        const card = await this.getCardWithList(comment.cardId);
        const boardId = card.list.boardId;
        const membership = await this.boardMemberRepository.findOne({
            where: { boardId, userId },
        });
        if (membership?.role === enums_1.BoardRole.ADMIN) {
            return;
        }
        throw new common_1.ForbiddenException('You can only modify your own comments');
    }
    async update(id, updateCommentDto, userId) {
        const comment = await this.findOne(id);
        await this.validateCommentPermission(comment, userId);
        comment.content = updateCommentDto.content;
        await this.commentRepository.save(comment);
        const updatedComment = await this.findOne(id);
        this.commentsGateway.emitCommentUpdated(comment.cardId, updatedComment);
        return updatedComment;
    }
    async remove(id, userId) {
        const comment = await this.findOne(id);
        await this.validateCommentPermission(comment, userId);
        await this.commentRepository.softDelete(id);
        this.commentsGateway.emitCommentDeleted(comment.cardId, id);
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Comment)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Card)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.BoardMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        comments_gateway_1.CommentsGateway,
        activities_service_1.ActivitiesService,
        notifications_service_1.NotificationsService,
        mailer_service_1.MailerService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map