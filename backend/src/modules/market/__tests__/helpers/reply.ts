export function createReply() {
  const state = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    payload: undefined as unknown,
    sent: false,
  };

  const reply = {
    code(statusCode: number) {
      state.statusCode = statusCode;
      return reply;
    },
    header(name: string, value: string) {
      state.headers[name.toLowerCase()] = value;
      return reply;
    },
    send(payload?: unknown) {
      state.payload = payload;
      state.sent = true;
      return payload;
    },
  };

  return { reply, state };
}

export async function callHandler<T>(
  handler: (req: unknown, reply: ReturnType<typeof createReply>['reply']) => T | Promise<T>,
  req: unknown,
) {
  const { reply, state } = createReply();
  const result = await handler(req, reply);
  return { result, state };
}

