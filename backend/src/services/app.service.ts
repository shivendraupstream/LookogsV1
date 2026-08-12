import { AppRepository } from "../repositories/repositories.js";
import { SourceService } from "./source.service.js";

const sourceService = new SourceService();

export class AppService {
  private appRepository = new AppRepository();

  async create(name: string, description?: string) {
    const data: { name: string; description?: string } = { name };
    if (description !== undefined) data.description = description;

    const app = await this.appRepository.create(data);

    const defaultSource = await sourceService.create(app.id, "Default", "production");

    return {
      ...app,
      defaultSource: {
        id: defaultSource.id,
        name: defaultSource.name,
        environment: defaultSource.environment,
        apiKey: defaultSource.apiKey,
      },
    };
  }

  async findAll() {
    return this.appRepository.findAll();
  }

  async findById(id: string) {
    return this.appRepository.findById(id);
  }

  async update(id: string, name?: string, description?: string) {
    const data: { name?: string; description?: string } = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    return this.appRepository.update(id, data);
  }

  async delete(id: string) {
    return this.appRepository.delete(id);
  }
}