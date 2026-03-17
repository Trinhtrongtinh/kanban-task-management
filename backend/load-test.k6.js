/**
 * Cache Performance Load Test using k6
 * ==========================================
 * 
 * Purpose: Validate cache hit ratios and p95 response time under load
 * 
 * What this test does:
 * 1. Ramps up 10 virtual users over 10 seconds (gradual load increase)
 * 2. Each user makes repeated requests to cached endpoints
 * 3. Measures response times and cache hit ratios
 * 4. Reports: p95 latency, cache hit rate, and other metrics
 * 
 * Success Criteria:
 * - p95 response time < 200ms (cached responses < 50ms, cache hits > 80%)
 * - Cache is working: second/third requests much faster than first
 * 
 * How to Run:
 * 1. Start backend: npm run start:dev
 * 2. Run test: k6 run load-test.k6.js
 * 3. Or run with options: k6 run --vus 20 --duration 30s load-test.k6.js
 *    (vus = virtual users, duration = test length)
 */

import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const cacheHitRate = new Rate('cache_hit_rate');
const writeSuccessRate = new Rate('write_success_rate');
const responseTime = new Trend('response_time_ms');
const workspaceLatency = new Trend('workspaces_latency_ms');
const boardsLatency = new Trend('boards_latency_ms');
const labelsLatency = new Trend('labels_latency_ms');
const notificationsLatency = new Trend('notifications_latency_ms');
const writeLatency = new Trend('write_latency_ms');
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest123!@#';

// Realistic staging profile (default peak = 200 concurrent users)
const READ_PEAK_VUS = Number(__ENV.READ_PEAK_VUS || 170);
const MIX_VUS = Number(__ENV.MIX_VUS || 30);
const RAMP_UP = __ENV.RAMP_UP || '2m';
const STEADY = __ENV.STEADY || '8m';
const RAMP_DOWN = __ENV.RAMP_DOWN || '2m';
const MIX_START = __ENV.MIX_START || '1m';
const MIX_DURATION = __ENV.MIX_DURATION || '10m';

export const options = {
  scenarios: {
    read_heavy: {
      executor: 'ramping-vus',
      exec: 'readHeavyScenario',
      startVUs: 0,
      stages: [
        { duration: RAMP_UP, target: READ_PEAK_VUS },
        { duration: STEADY, target: READ_PEAK_VUS },
        { duration: RAMP_DOWN, target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    read_write_mix: {
      executor: 'constant-vus',
      exec: 'readWriteMixScenario',
      vus: MIX_VUS,
      duration: MIX_DURATION,
      startTime: MIX_START,
      gracefulStop: '30s',
    },
  },
  thresholds: {
    response_time_ms: ['p(95) < 250'],
    cache_hit_rate: ['rate > 0.8'],
    http_req_failed: ['rate < 0.05'],
    write_success_rate: ['rate > 0.95'],
  },
};

function generateUnique() {
  return `loadtest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseBody(response) {
  try {
    return JSON.parse(response.body);
  } catch {
    return null;
  }
}

function apiData(response) {
  const parsed = parseBody(response);
  if (parsed && typeof parsed === 'object' && parsed.data !== undefined) {
    return parsed.data;
  }
  return parsed;
}

function trackCacheByLatency(durationMs) {
  const isLikelyCacheHit = durationMs < 50;
  cacheHitRate.add(isLikelyCacheHit);
  if (isLikelyCacheHit) {
    cacheHits.add(1);
  } else {
    cacheMisses.add(1);
  }
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function runReadSuite(token, wsId, bId) {
  const headers = authHeaders(token);

  group('Workspaces API', () => {
    const res = http.get(`${BASE_URL}/workspaces`, {
      headers,
      tags: { name: 'get_workspaces' },
    });
    responseTime.add(res.timings.duration);
    workspaceLatency.add(res.timings.duration);
    trackCacheByLatency(res.timings.duration);
    check(res, {
      'workspaces 200': (r) => r.status === 200,
      'workspaces < 250ms': (r) => r.timings.duration < 250,
    });
  });

  sleep(0.05);

  if (wsId) {
    group('Boards API', () => {
      const res = http.get(`${BASE_URL}/boards/workspace/${wsId}`, {
        headers,
        tags: { name: 'get_boards_by_workspace' },
      });
      responseTime.add(res.timings.duration);
      boardsLatency.add(res.timings.duration);
      trackCacheByLatency(res.timings.duration);
      check(res, {
        'boards 200': (r) => r.status === 200,
        'boards < 250ms': (r) => r.timings.duration < 250,
      });
    });
  }

  sleep(0.05);

  if (bId) {
    group('Labels API', () => {
      const res = http.get(`${BASE_URL}/labels/board/${bId}`, {
        headers,
        tags: { name: 'get_labels_by_board' },
      });
      responseTime.add(res.timings.duration);
      labelsLatency.add(res.timings.duration);
      trackCacheByLatency(res.timings.duration);
      check(res, {
        'labels 200': (r) => r.status === 200,
        'labels < 250ms': (r) => r.timings.duration < 250,
      });
    });
  }

  sleep(0.05);

  group('Notifications API', () => {
    const res = http.get(`${BASE_URL}/notifications`, {
      headers,
      tags: { name: 'get_notifications' },
    });
    responseTime.add(res.timings.duration);
    notificationsLatency.add(res.timings.duration);
    trackCacheByLatency(res.timings.duration);
    check(res, {
      'notifications 200': (r) => r.status === 200,
      'notifications < 250ms': (r) => r.timings.duration < 250,
    });
  });
}

function runWriteAction(token, wsId) {
  const headers = authHeaders(token);

  // 60% write traffic: mark-all-read (idempotent write, low side effects)
  // 40% write traffic: workspace PATCH (real DB write + cache invalidation)
  const writeRoll = Math.random();
  if (writeRoll < 0.6) {
    const markAllRes = http.post(`${BASE_URL}/notifications/mark-all-read`, null, {
      headers,
      tags: { name: 'post_mark_all_notifications_read' },
    });
    writeLatency.add(markAllRes.timings.duration);
    const ok = markAllRes.status === 201;
    writeSuccessRate.add(ok);
    check(markAllRes, {
      'mark-all-read 201': (r) => r.status === 201,
    });
    return;
  }

  const patchRes = http.patch(
    `${BASE_URL}/workspaces/${wsId}`,
    JSON.stringify({
      description: `lt-heartbeat-vu${__VU}-iter${__ITER}`,
    }),
    {
      headers,
      tags: { name: 'patch_workspace_description' },
    },
  );
  writeLatency.add(patchRes.timings.duration);
  const ok = patchRes.status === 200;
  writeSuccessRate.add(ok);
  check(patchRes, {
    'patch workspace 200': (r) => r.status === 200,
  });
}

export function setup() {
  console.log(`[setup] Using BASE_URL=${BASE_URL}`);
  console.log(
    `[setup] Staging profile read_peak=${READ_PEAK_VUS}, mix_vus=${MIX_VUS}, total_peak=${READ_PEAK_VUS + MIX_VUS}`,
  );

  const email = `${generateUnique()}@loadtest.com`;
  const username = `lt_${generateUnique()}`;

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      username,
      email,
      password: TEST_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'register' },
    },
  );

  check(registerRes, {
    'register status is 201': (r) => r.status === 201,
  });

  if (registerRes.status !== 201) {
    console.error(`[setup] Register failed: status=${registerRes.status} body=${registerRes.body}`);
    fail('Setup failed at register step');
  }

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email,
      password: TEST_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'login' },
    },
  );

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  const loginPayload = apiData(loginRes);
  const authToken = loginPayload?.accessToken;
  const userId = loginPayload?.user?.id;

  if (!authToken) {
    console.error(`[setup] Login token missing: status=${loginRes.status} body=${loginRes.body}`);
    fail('Setup failed: no access token from login');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  const workspaceRes = http.post(
    `${BASE_URL}/workspaces`,
    JSON.stringify({
      name: `Load Test Workspace ${generateUnique()}`,
      description: 'Workspace for cache load test',
    }),
    {
      headers,
      tags: { name: 'create_workspace' },
    },
  );

  check(workspaceRes, {
    'workspace status is 201': (r) => r.status === 201,
  });

  if (workspaceRes.status !== 201) {
    console.error(`[setup] Create workspace failed: status=${workspaceRes.status} body=${workspaceRes.body}`);
    fail('Setup failed at create workspace step');
  }

  const workspaceData = apiData(workspaceRes);
  const workspaceId = workspaceData?.id;

  const boardRes = http.post(
    `${BASE_URL}/boards`,
    JSON.stringify({
      title: `Load Test Board ${generateUnique()}`,
      workspaceId,
    }),
    {
      headers,
      tags: { name: 'create_board' },
    },
  );

  check(boardRes, {
    'board status is 201': (r) => r.status === 201,
  });

  if (boardRes.status !== 201) {
    console.error(`[setup] Create board failed: status=${boardRes.status} body=${boardRes.body}`);
    fail('Setup failed at create board step');
  }

  const boardData = apiData(boardRes);
  const boardId = boardData?.id;

  console.log(`[setup] Ready: userId=${userId} workspaceId=${workspaceId} boardId=${boardId}`);

  return {
    authToken,
    userId,
    workspaceId,
    boardId,
  };
}

export default function (data) {
  // Keep default export for backwards compatibility; route to read-heavy flow.
  readHeavyScenario(data);
}

export function readHeavyScenario(data) {
  const token = data?.authToken;
  const wsId = data?.workspaceId;
  const bId = data?.boardId;

  if (!token) {
    fail('No auth token available from setup');
  }

  runReadSuite(token, wsId, bId);

  // Low-frequency metrics probe to avoid log noise under high VU
  if (__ITER % 50 === 0 && __VU <= 3) {
    const res = http.get(`${BASE_URL}/metrics`, {
      tags: { name: 'get_metrics' },
    });
    check(res, {
      'metrics 200': (r) => r.status === 200,
    });
  }

  sleep(0.4);
}

export function readWriteMixScenario(data) {
  const token = data?.authToken;
  const wsId = data?.workspaceId;
  const bId = data?.boardId;

  if (!token) {
    fail('No auth token available from setup');
  }

  // Mixed traffic profile: 70% reads, 30% writes
  const roll = Math.random();
  if (roll < 0.7) {
    runReadSuite(token, wsId, bId);
  } else {
    runWriteAction(token, wsId);
  }

  sleep(0.2);
}

export function teardown() {
  console.log('\n========== LOAD TEST SUMMARY ==========');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(
    `Profile: read_peak=${READ_PEAK_VUS}, mix_vus=${MIX_VUS}, total_peak=${READ_PEAK_VUS + MIX_VUS}, steady=${STEADY}`,
  );
  console.log('Use k6 built-in summary for exact totals, p95 and hit-rate thresholds.');
  console.log('======================================\n');
}
