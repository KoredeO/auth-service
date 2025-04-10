import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Automation, AutomationDocument, AutomationTrigger, AutomationAction } from './schemas/automation.schema';
import { TasksService } from '../tasks/tasks.service';
import { MailService } from '../mail/mail.service';
import { Task } from '../tasks/schemas/task.schema';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectModel(Automation.name) private automationModel: Model<AutomationDocument>,
    private tasksService: TasksService,
    private mailService: MailService,
  ) {}

  async create(userId: Types.ObjectId, data: Partial<Automation>): Promise<Automation> {
    const automation = new this.automationModel({
      ...data,
      owner: userId,
    });
    return automation.save();
  }

  async findAll(userId: Types.ObjectId): Promise<Automation[]> {
    return this.automationModel.find({ owner: userId }).exec();
  }

  async update(
    id: string,
    userId: Types.ObjectId,
    data: Partial<Automation>,
  ): Promise<Automation> {
    const automation = await this.automationModel
      .findOneAndUpdate(
        { _id: id, owner: userId },
        { $set: data },
        { new: true },
      )
      .exec();
      
    if (!automation) {
      throw new NotFoundException('Automation not found');
    }
    
    return automation;
  }

  async delete(id: string, userId: Types.ObjectId): Promise<void> {
    await this.automationModel.deleteOne({ _id: id, owner: userId }).exec();
  }

  async processTrigger(
    trigger: AutomationTrigger,
    context: any,
    userId: Types.ObjectId,
  ): Promise<void> {
    const automations = await this.automationModel
      .find({ trigger, isActive: true })
      .exec();

    for (const automation of automations) {
      try {
        if (this.evaluateConditions(automation.conditions, context)) {
          await this.executeActions(automation.actions, context, userId);
          
          await this.automationModel.updateOne(
            { _id: automation._id },
            {
              $inc: { executionCount: 1 },
              $set: { lastExecution: new Date() },
            },
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to process automation ${automation._id}: ${error.message}`,
        );
      }
    }
  }

  private evaluateConditions(conditions: any[], context: any): boolean {
    return conditions.every((condition) => {
      const value = this.getNestedValue(context, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return value?.includes(condition.value);
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        case 'in':
          return condition.value.includes(value);
        case 'not_in':
          return !condition.value.includes(value);
        default:
          return false;
      }
    });
  }

  private async executeActions(
    actions: { type: AutomationAction; params: any }[],
    context: any,
    userId: Types.ObjectId,
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case AutomationAction.CREATE_TASK:
            await this.tasksService.create(action.params, userId);
            break;

          case AutomationAction.UPDATE_TASK:
            if (context.taskId) {
              await this.tasksService.update(
                context.taskId,
                action.params,
                userId,
              );
            }
            break;

          case AutomationAction.SEND_EMAIL:
            await this.mailService.sendEmail({
              to: action.params.to,
              subject: this.interpolateTemplate(action.params.subject, context),
              text: this.interpolateTemplate(action.params.body, context),
            });
            break;

          case AutomationAction.ASSIGN_TASK:
            if (context.taskId) {
              await this.tasksService.update(
                context.taskId,
                { ...action.params, title: context.title || 'Task Update' },
                userId,
              );
            }
            break;

          case AutomationAction.SET_PRIORITY:
            if (context.taskId) {
              await this.tasksService.update(
                context.taskId,
                { ...action.params, title: context.title || 'Task Update' },
                userId,
              );
            }
            break;
        }
      } catch (error) {
        this.logger.error(
          `Failed to execute action ${action.type}: ${error.message}`,
        );
      }
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private interpolateTemplate(template: string, context: any): string {
    return template.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      return this.getNestedValue(context, path.trim()) ?? match;
    });
  }
}
