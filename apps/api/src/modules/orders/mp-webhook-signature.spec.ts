import { createHmac } from "node:crypto";
import { verifyMpWebhookSignature } from "./mp-webhook-signature";

describe("verifyMpWebhookSignature", () => {
  const secret = "test-webhook-secret";
  const dataId = "123456789";
  const requestId = "req-abc-001";
  const ts = "1700000000";

  function sign(manifest: string) {
    return createHmac("sha256", secret).update(manifest).digest("hex");
  }

  it("aceita assinatura válida", () => {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = sign(manifest);
    expect(
      verifyMpWebhookSignature({
        secret,
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: requestId,
        dataId,
      }),
    ).toBe(true);
  });

  it("rejeita assinatura inválida", () => {
    expect(
      verifyMpWebhookSignature({
        secret,
        xSignature: `ts=${ts},v1=${"0".repeat(64)}`,
        xRequestId: requestId,
        dataId,
      }),
    ).toBe(false);
  });

  it("rejeita headers ausentes", () => {
    expect(
      verifyMpWebhookSignature({
        secret,
        xSignature: null,
        xRequestId: requestId,
        dataId,
      }),
    ).toBe(false);
  });
});
