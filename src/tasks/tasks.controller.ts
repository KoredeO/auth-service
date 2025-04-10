import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto, CreateSubtaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Task, Priority } from './schemas/task.schema';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req): Promise<Task> {
    console.log('Creating task...');
    return this.tasksService.create(createTaskDto, req.user._id);
  }

  @Get()
  findAll(@Query() filters: TaskFilterDto, @Request() req): Promise<Task[]> {
    return this.tasksService.findAll(req.user._id, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req): Promise<Task> {
    return this.tasksService.findOne(id, req.user._id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ): Promise<Task> {
    console.log('Updating task...');
    return this.tasksService.update(id, updateTaskDto, req.user._id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.tasksService.remove(id, req.user._id);
  }

  @Post(':taskId/subtasks/')
  addSubtask(
    @Param('taskId') taskId: string,
    @Body() subtask: CreateSubtaskDto,
    @Request() req,
  ): Promise<Task> {
    return this.tasksService.addSubtask(taskId, subtask, req.user._id);
  }

  @Get(':id/suggest-priority')
  suggestPriority(@Param('id') id: string, @Request() req): Promise<Priority> {
    return this.tasksService.suggestPriority(id, req.user._id);
  }
}
