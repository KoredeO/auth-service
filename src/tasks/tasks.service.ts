import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Error as MongooseError } from 'mongoose';
import { Task, TaskDocument, Priority } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto, CreateSubtaskDto } from './dto/task.dto';
// import parser from 'cron-parser';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  private handleDatabaseError(error: any, message: string): never {
    this.logger.error(`${message}: ${error.message}`, error.stack);

    if (error instanceof MongooseError.ValidationError) {
      throw new BadRequestException(Object.values(error.errors)
        .map(err => err.message)
        .join(', '));
    }

    if (error instanceof MongooseError.CastError) {
      throw new BadRequestException('Invalid ID format');
    }

    if (error.code === 11000) { // Duplicate key error
      throw new BadRequestException('A task with these details already exists');
    }

    throw new InternalServerErrorException(message);
  }

  // private validateCronPattern(pattern: string): void {
  //   try {
  //     const cronParser = parser.parseExpression(pattern);
  //     cronParser.next();
  //     // parser.parseExpression(pattern);
  //   } catch (error) {
  //     this.logger.error(`Invalid cron pattern: ${pattern}`);
  //     throw new BadRequestException('Invalid recurrence pattern. Please use valid cron syntax.');
  //   }
  // }

  async create(createTaskDto: CreateTaskDto, userId: Types.ObjectId): Promise<Task> {
    try {
      // Validate recurrence pattern if present
      // if (createTaskDto.isRecurring && createTaskDto.recurrencePattern) {
      //   this.validateCronPattern(createTaskDto.recurrencePattern);
      // }
    

      // Create and validate task
      const task = new this.taskModel({
        ...createTaskDto,
        owner: userId,
      });

      // Attempt to save
      const savedTask = await task.save();
      this.logger.log(`Task created with ID: ${savedTask._id}`);
      return savedTask;

    } catch (error) {
      throw this.handleDatabaseError(error, 'Error creating task');
    }
  }

  async findAll(userId: Types.ObjectId, filters: TaskFilterDto): Promise<Task[]> {
    try {
      const query: any = { owner: userId };

      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.tags?.length) query.tags = { $in: filters.tags };
      if (filters.isRecurring !== undefined) query.isRecurring = filters.isRecurring;
      
      if (filters.dueDateStart || filters.dueDateEnd) {
        query.dueDate = {};
        if (filters.dueDateStart) query.dueDate.$gte = filters.dueDateStart;
        if (filters.dueDateEnd) query.dueDate.$lte = filters.dueDateEnd;
      }
      query.delete_flag = { $ne: 1 };
      // query.delete_flag = 0;

      const tasks = await this.taskModel
        .find(query)
        .populate('assignees', 'email name')
        .populate('subtasks')
        .populate('dependencies')
        .exec();

      this.logger.log(`Found ${tasks.length} tasks for user ${userId}`);
      return tasks;

    } catch (error) {
      throw this.handleDatabaseError(error, 'Error fetching tasks');
    }
  }

  async findOne(id: string, userId: Types.ObjectId): Promise<Task> {
    try {
      const task = await this.taskModel
        .findOne({ _id: id, owner: userId })
        .populate('assignees', 'email name')
        .populate('subtasks')
        .populate('dependencies')
        .exec();

      if (!task) {
        this.logger.warn(`Task ${id} not found for user ${userId}`);
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return task;

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw this.handleDatabaseError(error, 'Error fetching task');
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: Types.ObjectId): Promise<Task> {
    try {
      // if (updateTaskDto.isRecurring && updateTaskDto.recurrencePattern) {
      //   this.validateCronPattern(updateTaskDto.recurrencePattern);
      // }

      const task = await this.taskModel
        .findOneAndUpdate(
          { _id: id, owner: userId },
          { $set: updateTaskDto },
          { new: true, runValidators: true }
        )
        .populate('assignees', 'email name')
        .populate('subtasks')
        .populate('dependencies')
        .exec();

      if (!task) {
        this.logger.warn(`Task ${id} not found for user ${userId}`);
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      this.logger.log(`Task ${id} updated successfully`);
      return task;

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw this.handleDatabaseError(error, 'Error updating task');
    }
  }

  async remove(id: string, userId: Types.ObjectId): Promise<void> {
    try {
      const result = await this.taskModel.findOneAndUpdate({ _id: id, owner: userId }, { $set: { delete_flag: 1 } }, { new: true })
      if (!result) {
        this.logger.warn(`Task ${id} not found for user ${userId}`);
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      this.logger.log(`Task ${id} deleted successfully`);

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw this.handleDatabaseError(error, 'Error deleting task');
    }
  }

  async addSubtask(taskId: string, createSubtaskDto: CreateSubtaskDto, userId: Types.ObjectId): Promise<Task> {
    // Find the parent task by its ID
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    const subtask = new this.taskModel({
      ...createSubtaskDto,
      priority: task.priority,
      status: task.status,
      owner: userId,
      parentTask: task._id,
    });
    await subtask.save();

    task.subtasks.push(subtask._id as Types.ObjectId);
    await task.save();

    return subtask;
  }

  async suggestPriority(id: string, userId: Types.ObjectId): Promise<Priority> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  
    const currentDate = new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  
    if (dueDate) {
      if (dueDate < currentDate) {
        return Priority.URGENT;
      }
  
      const timeDifference = dueDate.getTime() - currentDate.getTime();
      const hoursRemaining = timeDifference / (1000 * 3600);
  
      if (hoursRemaining <= 24) {
        return Priority.HIGH;
      }
  
      const daysRemaining = hoursRemaining / 24;
      if (daysRemaining <= 7) {
        return Priority.MEDIUM;
      }
  
      return task.priority || Priority.LOW;
    }
  
    return task.priority || Priority.LOW;
  }


}