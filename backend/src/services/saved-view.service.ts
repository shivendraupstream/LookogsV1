import { SavedViewRepository } from "../repositories/repositories.js";
import { Prisma } from "../generated/prisma/client.js";

export class SavedViewService {
  private savedViewRepository = new SavedViewRepository();

  async create(appId: string, name: string, filters: Prisma.InputJsonValue) {
    return this.savedViewRepository.create({ name, filters, appId });
  }

  async findAllByApp(appId: string) {
    return this.savedViewRepository.findAllByApp(appId);
  }

  async delete(id: string) {
    return this.savedViewRepository.delete(id);
  }
}