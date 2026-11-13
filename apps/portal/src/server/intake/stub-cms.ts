import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface StubCmsRow {
  id: string | number;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company: string;
  website?: string | null;
  partnerReason?: string | null;
  honeypot?: string | null;
  turnstilePassed?: boolean | null;
  piiRedactedAt?: string | null;
}

export interface StubCmsOptions {
  apiKey?: string;
  /** Listen on a fixed port (scripts); default is a free port. */
  port?: number;
  /** Force a smaller page than the client asked for, to test pagination without hundreds of rows. */
  pageSize?: number;
}

export interface StubCms {
  url: string;
  apiKey: string;
  /** Mutate to add or change what the stub serves. */
  rows: StubCmsRow[];
  requests: Array<{ pathname: string; search: string; authorization: string | undefined }>;
  /** Make one page answer with an error status. */
  failPage: { page: number; status: number } | null;
  close(): Promise<void>;
}

const send = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

const handle = (stub: StubCms, options: StubCmsOptions, req: IncomingMessage, res: ServerResponse): void => {
  const url = new URL(req.url ?? '/', 'http://stub.local');
  stub.requests.push({ pathname: url.pathname, search: url.search, authorization: req.headers.authorization });
  if (req.method !== 'GET' || url.pathname !== '/api/partner-applications') {
    send(res, 404, { message: 'Not Found' });
    return;
  }
  if (req.headers.authorization !== `users API-Key ${stub.apiKey}`) {
    send(res, 403, { errors: [{ message: 'You are not allowed to perform this action.' }] });
    return;
  }
  const params = url.searchParams;
  const limit = Math.max(1, Number(params.get('limit') ?? 10));
  const pageSize = options.pageSize ?? limit;
  const page = Math.max(1, Number(params.get('page') ?? 1));
  if (stub.failPage?.page === page) {
    send(res, stub.failPage.status, { errors: [{ message: 'Stub failure' }] });
    return;
  }
  const after = params.get('where[createdAt][greater_than]');
  const atOrAfter = params.get('where[createdAt][greater_than_equal]');
  const matching = stub.rows
    .filter((row) => (after === null || Date.parse(row.createdAt) > Date.parse(after)))
    .filter((row) => (atOrAfter === null || Date.parse(row.createdAt) >= Date.parse(atOrAfter)))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  if (params.get('sort') === '-createdAt') matching.reverse();
  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  send(res, 200, {
    docs: matching.slice((page - 1) * pageSize, page * pageSize),
    totalDocs: matching.length,
    limit: pageSize,
    totalPages,
    page,
    pagingCounter: (page - 1) * pageSize + 1,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  });
};

export async function startStubCms(rows: StubCmsRow[], options: StubCmsOptions = {}): Promise<StubCms> {
  const stub: StubCms = {
    url: '',
    apiKey: options.apiKey ?? 'stub-key',
    rows,
    requests: [],
    failPage: null,
    close: async () => undefined,
  };
  const server = createServer((req, res) => handle(stub, options, req, res));
  await new Promise<void>((resolve) => server.listen(options.port ?? 0, '127.0.0.1', resolve));
  stub.url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  let closing: Promise<void> | null = null;
  // Closing twice is a no-op, so a test hook can close whatever the last test left behind.
  stub.close = () => {
    closing ??= new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    return closing;
  };
  return stub;
}
