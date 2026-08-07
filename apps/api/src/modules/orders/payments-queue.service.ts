import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job, Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { recordFailedWebhook } from "../audit/failed-webhook.store";
import { captureDomainError } from "../observability/capture";
import { PrismaService } from "../../prisma/prisma.service";
import { CheckoutService } from "./checkout.service";
import { MpClient } from "./mp.client";
import {
  MP_PAYMENT_WEBHOOKS_QUEUE,
  type MpPaymentWebhookJob,
} from "./payments-queue.types";
import {
  markWebhookEventFailed,
  markWebhookEventProcessed,
  releaseWebhookEventClaim,
} from "./webhook-event";

@Injectable()
export class PaymentsQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsQueueService.name);
  private connection: IORedis | null = null;
  private queue: Queue<MpPaymentWebhookJob> | null = null;
  private worker: Worker<MpPaymentWebhookJob> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mp: MpClient,
    private readonly checkout: CheckoutService,
  ) {}

  get isReady(): boolean {
    return Boolean(this.queue);
  }

  async onModuleInit() {
    const redisUrl = this.config.get<string>("REDIS_URL")?.trim();
    if (!redisUrl) {
      this.logger.warn(
        "REDIS_URL ausente — webhooks Mercado Pago retornarão 503 até configurar Redis",
      );
      return;
    }

    try {
      this.connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
      });
      this.connection.on("error", (err) => {
        this.logger.error(`Redis error: ${err.message}`);
      });

      this.queue = new Queue<MpPaymentWebhookJob>(MP_PAYMENT_WEBHOOKS_QUEUE, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 2_000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });

      this.worker = new Worker<MpPaymentWebhookJob>(
        MP_PAYMENT_WEBHOOKS_QUEUE,
        (job) => this.processJob(job),
        { connection: this.connection.duplicate(), concurrency: 4 },
      );

      this.worker.on("failed", (job, err) => {
        this.logger.warn(
          `Job ${job?.id} failed attempt ${job?.attemptsMade}: ${err.message}`,
        );
      });

      this.logger.log(`BullMQ worker listening on ${MP_PAYMENT_WEBHOOKS_QUEUE}`);
    } catch (error) {
      this.logger.error(
        `Falha ao iniciar fila Redis: ${error instanceof Error ? error.message : error}`,
      );
      await this.shutdown();
    }
  }

  async onModuleDestroy() {
    await this.shutdown();
  }

  private async shutdown() {
    await this.worker?.close().catch(() => undefined);
    await this.queue?.close().catch(() => undefined);
    await this.connection?.quit().catch(() => undefined);
    this.worker = null;
    this.queue = null;
    this.connection = null;
  }

  async enqueue(job: MpPaymentWebhookJob): Promise<void> {
    if (!this.queue) {
      throw new ServiceUnavailableException(
        "Fila de webhooks indisponível (REDIS_URL)",
      );
    }
    await this.queue.add("mp-payment", job, {
      jobId: job.messageId,
    });
  }

  private async processJob(job: Job<MpPaymentWebhookJob>): Promise<void> {
    const { messageId, paymentId, payload, traceId, failedWebhookId } =
      job.data;

    try {
      const mpPayment = await this.mp.getPayment(paymentId);
      const result = await this.checkout.applyMpPaymentUpdate(mpPayment);

      await this.prisma.payment.updateMany({
        where: { transactionId: paymentId },
        data: { messageId },
      });

      await markWebhookEventProcessed(this.prisma, messageId);

      if (failedWebhookId) {
        await this.prisma.failedWebhook.updateMany({
          where: { id: failedWebhookId },
          data: { status: "discarded" },
        });
      }

      this.logger.debug(
        `Webhook processed messageId=${messageId} order=${result.orderId}`,
      );
    } catch (error) {
      const attempts = job.opts.attempts ?? 1;
      const isLast = job.attemptsMade >= attempts;

      if (isLast) {
        await markWebhookEventFailed(this.prisma, messageId);
        await recordFailedWebhook(this.prisma, {
          payload: payload as never,
          reason: error instanceof Error ? error.message : "webhook_error",
          traceId,
          status: failedWebhookId ? "exhausted" : "pending",
        });
        if (failedWebhookId) {
          await this.prisma.failedWebhook.updateMany({
            where: { id: failedWebhookId },
            data: { status: "exhausted" },
          });
        }
        captureDomainError("webhook", error, { messageId, paymentId, traceId });
      }

      throw error;
    }
  }

  /** Used when enqueue fails after claim — allow MP to retry. */
  async releaseClaim(messageId: string): Promise<void> {
    await releaseWebhookEventClaim(this.prisma, messageId);
  }
}
