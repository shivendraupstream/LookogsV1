import { createHash, randomBytes } from "node:crypto";
import { SourceRepository } from "../repositories/repositories.js";

function generateApiKey() {
  return randomBytes(32).toString("hex");
}

function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export class SourceService {
  private sourceRepository = new SourceRepository();

  async rotateKey(id: string) {
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);
    const source = await this.sourceRepository.updateApiKeyHash(id, apiKeyHash);
    return { ...source, apiKey };
  }

  async create(appId: string, name: string, environment: string) {
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    const source = await this.sourceRepository.create({
      name,
      environment,
      apiKeyHash,
      appId,
    });

    return { ...source, apiKey };
  }

  async findAllByApp(appId: string) {
    return this.sourceRepository.findAllByApp(appId);
  }

  async findById(id: string) {
    return this.sourceRepository.findById(id);
  }

  async findByApiKey(rawKey: string) {
    return this.sourceRepository.findByApiKeyHash(hashApiKey(rawKey));
  }

  async update(id: string, name?: string, environment?: string) {
    const data: { name?: string; environment?: string } = {};
    if (name !== undefined) data.name = name;
    if (environment !== undefined) data.environment = environment;
    return this.sourceRepository.update(id, data);
  }

  async delete(id: string) {
    return this.sourceRepository.delete(id);
  }
}
