export interface IngestLog {
  message: string;
  severity: string;
  eventTime: string;
  service?: string | undefined;
  attributes?: Record<string, unknown>;
}

export interface IngestRequest {
  logs: IngestLog[];
}