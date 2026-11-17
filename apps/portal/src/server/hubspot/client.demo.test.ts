import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_PIPELINE_ID, demoHubspot } from './demo';
import { createHubspot, readHubspotConfig } from './client';
import { hubspotForRequest } from './lookup';

afterEach(() => vi.unstubAllEnvs());

describe('HubSpot in demo mode', () => {
  it('reports the demo pipeline as configured and hands out the shared fake, so no real token is needed', () => {
    vi.stubEnv('PORTAL_DEMO_MODE', '1');
    expect(readHubspotConfig()).toEqual({ token: 'demo', pipelineId: DEMO_PIPELINE_ID });
    expect(createHubspot()).toBe(demoHubspot());
    expect(hubspotForRequest()).toEqual({ hs: demoHubspot(), pipelineId: DEMO_PIPELINE_ID });
  });

  it('is untouched when the switch is off: nothing configured, creating a client needs a token', () => {
    vi.stubEnv('PORTAL_DEMO_MODE', 'true');
    expect(readHubspotConfig()).toBeNull();
    expect(() => createHubspot()).toThrow(/HUBSPOT_PORTAL_TOKEN/);
    expect(hubspotForRequest()).toBeNull();
  });
});
