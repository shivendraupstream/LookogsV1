import { prisma } from "../lib/prisma.js";

export { LogRepository, type CreateLogsInput, type FindLogsQuery, type ParsedLog } from "./log.repositories.js";

export class AppRepository {
  async create(data: {
    name: string;
    description?: string;
  }) {
    return prisma.app.create({
      data,
    });
  }

  async findAll() {
    return prisma.app.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.app.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
    }
  ) {
    return prisma.app.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.app.delete({
      where: { id },
    });
  }
}

export class SourceRepository {
  async create(data: {
    name: string;
    environment: string;
    apiKeyHash: string;
    appId: string;
  }) {
    return prisma.source.create({
      data,
    });
  }

  async findAllByApp(appId: string) {
    return prisma.source.findMany({
      where: { appId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.source.findUnique({
      where: { id },
    });
  }

  async findByApiKeyHash(apiKeyHash: string) {
    return prisma.source.findUnique({
      where: { apiKeyHash },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      environment?: string;
    }
  ) {
    return prisma.source.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.source.delete({
      where: { id },
    });
  }
}

export class SavedViewRepository {
  async create(data: { name: string; filters: any; appId: string }) {
    return prisma.savedView.create({ data });
  }

  async findAllByApp(appId: string) {
    return prisma.savedView.findMany({
      where: { appId },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string) {
    return prisma.savedView.delete({ where: { id } });
  }
}