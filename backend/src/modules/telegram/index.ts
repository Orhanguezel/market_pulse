export async function telegramNotify(_input: {
  event: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  // Telegram integration is not part of the MarketPulse standalone scope.
}
