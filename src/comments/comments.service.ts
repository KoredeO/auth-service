import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async create(
    taskId: string,
    userId: Types.ObjectId,
    content: string,
    parentCommentId?: string,
    mentions: string[] = [],
  ): Promise<Comment> {
    const comment = new this.commentModel({
      author: userId,
      content,
      taskId: new Types.ObjectId(taskId),
      parentComment: parentCommentId ? new Types.ObjectId(parentCommentId) : undefined,
      mentions: mentions.map(id => new Types.ObjectId(id)),
    });

    const savedComment = await comment.save();
    const populatedComment = await this.commentModel.findById(savedComment._id)
      .populate('author', 'email name')
      .populate('mentions', 'email name')
      .exec();

    // Notify all users in the task room about the new comment
    this.realtimeGateway.server.to(`task:${taskId}`).emit('commentAdded', {
      taskId,
      comment: populatedComment,
    });

    if (!populatedComment) {
      throw new NotFoundException('Comment not found after creation');
    }
    return populatedComment;
  }

  async findByTask(taskId: string): Promise<Comment[]> {
    return this.commentModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .populate('author', 'email name')
      .populate('mentions', 'email name')
      .populate('parentComment')
      .sort({ createdAt: 1 })
      .exec();
  }

  async update(
    commentId: string,
    userId: Types.ObjectId,
    content: string,
  ): Promise<Comment> {
    const comment = await this.commentModel
      .findOneAndUpdate(
        { _id: commentId, author: userId },
        { content },
        { new: true },
      )
      .populate('author', 'email name')
      .populate('mentions', 'email name')
      .exec();

    if (!comment) {
      throw new NotFoundException('Comment not found or unauthorized');
    }

    // Notify all users in the task room about the updated comment
    this.realtimeGateway.server.to(`task:${comment.taskId}`).emit('commentUpdated', {
      taskId: comment.taskId,
      comment,
    });

    return comment;
  }

  async delete(commentId: string, userId: Types.ObjectId): Promise<void> {
    const comment = await this.commentModel.findOne({ _id: commentId });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.toString() !== userId.toString()) {
      throw new NotFoundException('Unauthorized to delete this comment');
    }

    await this.commentModel.deleteOne({ _id: commentId });

    // Notify all users in the task room about the deleted comment
    this.realtimeGateway.server.to(`task:${comment.taskId}`).emit('commentDeleted', {
      taskId: comment.taskId,
      commentId,
    });
  }

  async getThreadComments(parentCommentId: string): Promise<Comment[]> {
    return this.commentModel
      .find({ parentComment: new Types.ObjectId(parentCommentId) })
      .populate('author', 'email name')
      .populate('mentions', 'email name')
      .sort({ createdAt: 1 })
      .exec();
  }
}
