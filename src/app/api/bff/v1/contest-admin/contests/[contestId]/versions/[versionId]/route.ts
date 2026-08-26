import type { NextRequest } from 'next/server';
import { contestAsyncResponse } from '@/lib/contest-admin/http';
import { builder, patchBuilder } from '@/lib/contest-admin/contest-service';

type Context = { params: Promise<{ contestId: string; versionId: string }> };

export async function GET(_: NextRequest, context: Context) {
  const { contestId, versionId } = await context.params;
  return contestAsyncResponse(() => builder(contestId, versionId));
}

export async function PATCH(request: NextRequest, context: Context) {
  const { contestId, versionId } = await context.params;
  const body = await request.json() as { configuration?: Record<string, unknown> };
  return contestAsyncResponse(() => patchBuilder(contestId, versionId, body.configuration ?? {}, request.headers.get('if-match') ?? ''));
}