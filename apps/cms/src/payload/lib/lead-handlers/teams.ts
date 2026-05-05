import { createHmac } from 'node:crypto';

import type { LeadHandler, LeadSubmission } from './types';

/**
 * Teams handler — POSTs a Standard-Webhooks-signed payload to the
 * Teams workflow URL configured via TEAMS_WEBHOOK_URL. Signing key
 * comes from TEAMS_WEBHOOK_SECRET. Skipped when either env var is
 * missing so dev / CI stay quiet.
 *
 * Standard Webhooks (https://www.standardwebhooks.com) gives consumers
 * a stable, language-agnostic verification primitive — a sha256 HMAC
 * over `${id}.${timestamp}.${body}` plus monotonic id + timestamp
 * headers for replay protection.
 */
const TEAMS_EVENT_TYPE = 'lead.submitted';

const newWebhookId = (): string => {
  // RFC 9562 v7-ish — millisecond-prefixed monotonic id, no external dep.
  const ms = Date.now().toString(16).padStart(12, '0');
  const rand = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return `msg_${ms}${rand}`;
};

const sign = (secret: string, id: string, timestamp: string, payload: string): string => {
  const toSign = `${id}.${timestamp}.${payload}`;
  return `v1,${createHmac('sha256', secret).update(toSign).digest('base64')}`;
};

export const teamsHandler: LeadHandler = {
  name: 'teams',
  kind: 'secondary',
  async run(submission: LeadSubmission, ctx) {
    const url = process.env.TEAMS_WEBHOOK_URL;
    const secret = process.env.TEAMS_WEBHOOK_SECRET;
    if (!url || !secret) {
      return { handler: 'teams', status: 'skipped', reason: 'env-not-configured' };
    }

    if (ctx.duplicateOfLeadId != null) {
      return { handler: 'teams', status: 'skipped', reason: 'duplicate-submission' };
    }

    const id = newWebhookId();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({
      type: TEAMS_EVENT_TYPE,
      timestamp: new Date().toISOString(),
      data: {
        leadId: ctx.leadId,
        formId: submission.formId,
        formSchemaVersion: submission.formSchemaVersion,
        fields: submission.fields,
        source: submission.source,
        utm: submission.utm,
      },
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'webhook-id': id,
        'webhook-timestamp': timestamp,
        'webhook-signature': sign(secret, id, timestamp, body),
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return {
        handler: 'teams',
        status: 'failed',
        error: `Teams ${response.status}: ${text.slice(0, 200)}`,
      };
    }

    return { handler: 'teams', status: 'synced', externalId: id };
  },
};
