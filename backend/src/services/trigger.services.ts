import { TriggerRepository } from "../repositories/repositories.js";

export interface CreateTriggerInput {
  name: string;
  query: string;
  thresholdCount: number;
  windowMinutes?: number;
  webhookUrl: string;
  cooldownMinutes?: number;
}

export class TriggerService {
  private triggerRepository = new TriggerRepository();

  async create(appId: string, data: CreateTriggerInput) {
    return this.triggerRepository.create({
      appId,
      name: data.name,
      query: data.query,
      thresholdCount: data.thresholdCount,
      windowMinutes: data.windowMinutes ?? 5,
      webhookUrl: data.webhookUrl,
      cooldownMinutes: data.cooldownMinutes ?? 15,
    });
  }

  async findAllByApp(appId: string) {
    return this.triggerRepository.findAllByApp(appId);
  }

  async delete(id: string) {
    return this.triggerRepository.delete(id);
  }
}