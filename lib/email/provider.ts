export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  dedupeKey: string;
}
export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string }>;
}
export class UnconfiguredEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<{ id: string }> {
    void message;
    throw new Error(
      "Email delivery is not configured; notification remains queued.",
    );
  }
}
export function emailProvider(): EmailProvider {
  return new UnconfiguredEmailProvider();
}
