import { SavedViewRepository } from "../repositories/repositories.js";

export class SavedViewService {
  private savedViewRepository = new SavedViewRepository();

  async create(appId: string, name: string, filters: Record<string, unknown>) {
    return this.savedViewRepository.create({ name, filters, appId });
  }

  async findAllByApp(appId: string) {
    return this.savedViewRepository.findAllByApp(appId);
  }

  async delete(id: string) {
    return this.savedViewRepository.delete(id);
  }
}