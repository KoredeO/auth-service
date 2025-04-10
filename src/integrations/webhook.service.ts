import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Webhook, WebhookDocument, WebhookEvent } from './schemas/webhook.schema';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectModel(Webhook.name) private webhookModel: Model<WebhookDocument>,
  ) {}

  async create(
    userId: Types.ObjectId,
    data: {
      name: string;
      url: string;
      events: WebhookEvent[];
      headers?: Record<string, string>;
    },
  ): Promise<Webhook> {
    const secret = crypto.randomBytes(32).toString('hex');
    
    const webhook = new this.webhookModel({
      ...data,
      owner: userId,
      secret,
    });

    return webhook.save();
  }

  async findAll(userId: Types.ObjectId): Promise<Webhook[]> {
    return this.webhookModel.find({ owner: userId }).exec();
  }

  async update(
    id: string,
    userId: Types.ObjectId,
    data: Partial<Webhook>,
  ): Promise<Webhook> {
    const webhook = await this.webhookModel
      .findOneAndUpdate(
        { _id: id, owner: userId },
        { $set: data },
        { new: true },
      )
      .exec();

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async delete(id: string, userId: Types.ObjectId): Promise<void> {
    await this.webhookModel.deleteOne({ _id: id, owner: userId }).exec();
  }

  async triggerWebhooks(event: WebhookEvent, payload: any): Promise<void> {
    const webhooks = await this.webhookModel
      .find({ events: event, isActive: true })
      .exec();

    const promises = webhooks.map(async (webhook) => {
      try {
        const signature = this.generateSignature(webhook.secret, payload);
        const headers = {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          ...webhook.headers,
        };

        const response = await axios.post(webhook.url, payload, { headers });

        if (response.status >= 200 && response.status < 300) {
          await this.webhookModel.updateOne(
            { _id: webhook._id },
            {
              $set: { lastSuccess: new Date() },
              $inc: { executionCount: 1 },
            },
          );
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to trigger webhook ${webhook._id}: ${error.message}`,
        );
        await this.webhookModel.updateOne(
          { _id: webhook._id },
          {
            $set: { lastFailure: new Date() },
            $inc: { failureCount: 1 },
          },
        );
      }
    });

    await Promise.all(promises);
  }

  private generateSignature(secret: string, payload: any): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}
