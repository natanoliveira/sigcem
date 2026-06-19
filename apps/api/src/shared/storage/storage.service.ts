import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client;
  private readonly region = 'us-east-1';

  constructor(private config: ConfigService) {
    this.client = new Minio.Client({
      endPoint: config.getOrThrow('MINIO_ENDPOINT'),
      port: parseInt(config.getOrThrow('MINIO_PORT'), 10),
      useSSL: config.get('MINIO_USE_SSL') === 'true',
      accessKey: config.getOrThrow('MINIO_ACCESS_KEY'),
      secretKey: config.getOrThrow('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit() {
    this.logger.log('MinIO client initialized');
  }

  private bucketName(tenantId: string): string {
    // Bucket names must be lowercase and DNS-compliant
    return `sigcem-${tenantId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
  }

  async ensureBucket(tenantId: string): Promise<string> {
    const bucket = this.bucketName(tenantId);
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket, this.region);
      this.logger.log(`Bucket criado: ${bucket}`);
    }
    return bucket;
  }

  async upload(
    tenantId: string,
    objectKey: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    const bucket = await this.ensureBucket(tenantId);
    await this.client.putObject(bucket, objectKey, buffer, buffer.length, {
      'Content-Type': mimetype,
    });
    return objectKey;
  }

  // T-035 — URL assinada com TTL de 1 hora
  async presignedUrl(tenantId: string, objectKey: string, ttlSeconds = 3600): Promise<string> {
    const bucket = this.bucketName(tenantId);
    return this.client.presignedGetObject(bucket, objectKey, ttlSeconds);
  }

  async deleteObject(tenantId: string, objectKey: string): Promise<void> {
    const bucket = this.bucketName(tenantId);
    await this.client.removeObject(bucket, objectKey);
  }
}
