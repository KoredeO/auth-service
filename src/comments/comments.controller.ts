import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('task/:taskId')
  create(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: { content: string; parentCommentId?: string; mentions?: string[] },
    @Request() req,
  ) {
    return this.commentsService.create(
      taskId,
      req.user._id,
      createCommentDto.content,
      createCommentDto.parentCommentId,
      createCommentDto.mentions,
    );
  }

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string) {
    return this.commentsService.findByTask(taskId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: { content: string },
    @Request() req,
  ) {
    return this.commentsService.update(id, req.user._id, updateCommentDto.content);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.commentsService.delete(id, req.user._id);
  }

  @Get('thread/:parentCommentId')
  getThreadComments(@Param('parentCommentId') parentCommentId: string) {
    return this.commentsService.getThreadComments(parentCommentId);
  }
}
