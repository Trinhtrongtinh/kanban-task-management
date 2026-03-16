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
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics to track
const cacheHitRate = new Rate('cache_hit_rate');
const cacheMissRate = new Rate('cache_miss_rate');
const responseTime = new Trend('response_time_ms');
const workspaceLatency = new Trend('workspaces_latency_ms');
const boardsLatency = new Trend('boards_latency_ms');
const labelsLatency = new Trend('labels_latency_ms');
const notificationsLatency = new Trend('notifications_latency_ms');

const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || 'test-token';

// Test scenario configuration
export const options = {
  stages: [
    // Ramp up from 0 to 10 users over 10 seconds
    { duration: '10s', target: 10 },
    // Stay at 10 users for 20 seconds
    { duration: '20s', target: 10 },
    // Ramp down to 0 users over 5 seconds
    { duration: '5s', target: 0 },
  ],
  
  // Thresholds: Define success/failure criteria
  thresholds: {
    'response_time_ms': ['p(95) < 200'], // 95% of requests must complete in < 200ms
    'cache_hit_rate': ['rate > 0.8'], // Cache hit rate should be > 80%
    'http_req_failed': ['rate < 0.05'], // Less than 5% of requests should fail
  },
};

// Test data prep
let authToken = '';
let workspaceId = '';
let boardId = '';
let userId = '';

/**
 * Generates a unique string for test data
 */
function generateUnique() {
  return `load-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Before running load test: Setup - create test user, workspace, and board
 */
export function setup() {
  console.log('🚀 Setting up test data...');

  // Step 1: Register a test user
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email: `${generateUnique()}@loadtest.com`,
      password: 'LoadTest123!@#',
      name: 'Load Test User',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'register' },
    },
  );

  check(registerRes, {
    'Register status is 201 or 400 (user may exist)': (r) => r.status === 201 || r.status === 400,
  });

  if (registerRes.status !== 201 && registerRes.status !== 400) {
    console.error('❌ Registration failed:', registerRes.body);
    return {};
  }

  let registerData = {};
  try {
    registerData = JSON.parse(registerRes.body);
  } catch (e) {
    console.error('❌ Failed to parse register response:', registerRes.body);
    return {};
  }

  // Step 2: Login
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: registerData.user?.email || `${generateUnique()}@loadtest.com`,
      password: 'LoadTest123!@#',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'login' },
    },
  );

  check(loginRes, {
    'Login status is 200': (r) => r.status === 200,
  });

  if (loginRes.status !== 200) {
    console.error('❌ Login failed:', loginRes.body);
    return {};
  }

  const loginData = JSON.parse(loginRes.body);
  authToken = loginData.access_token;
  userId = loginData.user?.id;

  console.log(`✅ Logged in with token: ${authToken.substr(0, 20)}...`);

  // Step 3: Create a workspace
  const workspaceRes = http.post(
    `${BASE_URL}/workspaces`,
    JSON.stringify({
      name: `Load Test Workspace ${generateUnique()}`,
      description: 'Workspace for load testing cache',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      tags: { name: 'create_workspace' },
    },
  );

  check(workspaceRes, {
    'Create workspace status is 201': (r) => r.status === 201,
  });

  if (workspaceRes.status !== 201) {
    console.error('❌ Workspace creation failed:', workspaceRes.body);
    return { authToken, userId };
  }

  const workspaceData = JSON.parse(workspaceRes.body);
  workspaceId = workspaceData.id;

  console.log(`✅ Created workspace: ${workspaceId}`);

  // Step 4: Create a board
  const boardRes = http.post(
    `${BASE_URL}/boards`,
    JSON.stringify({
      name: `Load Test Board ${generateUnique()}`,
      workspaceId: workspaceId,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      tags: { name: 'create_board' },
    },
  );

  check(boardRes, {
    'Create board status is 201': (r) => r.status === 201,
  });

  if (boardRes.status !== 201) {
    console.error('❌ Board creation failed:', boardRes.body);
    return { authToken, userId, workspaceId };
  }

  const boardData = JSON.parse(boardRes.body);
  boardId = boardData.id;

  console.log(`✅ Created board: ${boardId}`);

  // Return setup data to be used in test scenario
  return {
    authToken,
    userId,
    workspaceId,
    boardId,
  };
}

/**
 * Main load test scenario
 * Runs for all virtual users across all stages
 */
export default function (data) {
  // Use setup data
  const token = data.authToken || authToken;
  const wsId = data.workspaceId || workspaceId;
  const bId = data.boardId || boardId;

  if (!token) {
    console.error('❌ No auth token available, skipping test');
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // TEST 1: Get workspaces (cached endpoint)
  group('Workspaces API - Cache Test', () => {
    const res = http.get(`${BASE_URL}/workspaces`, {
      headers,
      tags: { name: 'get_workspaces' },
    });

    const duration = res.timings.duration;
    responseTime.add(duration);
    workspaceLatency.add(duration);

    // Heuristic: If response time < 50ms, likely a cache hit
    const isLikelyCacheHit = duration < 50;
    if (isLikelyCacheHit) {
      cacheHits.add(1);
      cacheHitRate.add(true);
    } else {
      cacheMisses.add(1);
      cacheHitRate.add(false);
    }

    check(res, {
      'Status is 200': (r) => r.status === 200,
      'Response time < 200ms': (r) => r.timings.duration < 200,
      'Has workspaces': (r) => r.body && r.body.includes('id'),
    });
  });

  sleep(0.1); // Small delay between requests

  // TEST 2: Get boards for workspace (cached endpoint)
  if (wsId) {
    group('Boards API - Cache Test', () => {
      const res = http.get(`${BASE_URL}/boards?workspaceId=${wsId}`, {
        headers,
        tags: { name: 'get_boards' },
      });

      const duration = res.timings.duration;
      responseTime.add(duration);
      boardsLatency.add(duration);

      const isLikelyCacheHit = duration < 50;
      if (isLikelyCacheHit) {
        cacheHits.add(1);
        cacheHitRate.add(true);
      } else {
        cacheMisses.add(1);
        cacheHitRate.add(false);
      }

      check(res, {
        'Status is 200': (r) => r.status === 200,
        'Response time < 200ms': (r) => r.timings.duration < 200,
      });
    });
  }

  sleep(0.1);

  // TEST 3: Get labels for board (cached endpoint)
  if (bId) {
    group('Labels API - Cache Test', () => {
      const res = http.get(`${BASE_URL}/labels?boardId=${bId}`, {
        headers,
        tags: { name: 'get_labels' },
      });

      const duration = res.timings.duration;
      responseTime.add(duration);
      labelsLatency.add(duration);

      const isLikelyCacheHit = duration < 50;
      if (isLikelyCacheHit) {
        cacheHits.add(1);
        cacheHitRate.add(true);
      } else {
        cacheMisses.add(1);
        cacheHitRate.add(false);
      }

      check(res, {
        'Status is 200': (r) => r.status === 200,
        'Response time < 200ms': (r) => r.timings.duration < 200,
      });
    });
  }

  sleep(0.1);

  // TEST 4: Get notifications (cached endpoint)
  group('Notifications API - Cache Test', () => {
    const res = http.get(`${BASE_URL}/notifications`, {
      headers,
      tags: { name: 'get_notifications' },
    });

    const duration = res.timings.duration;
    responseTime.add(duration);
    notificationsLatency.add(duration);

    const isLikelyCacheHit = duration < 50;
    if (isLikelyCacheHit) {
      cacheHits.add(1);
      cacheHitRate.add(true);
    } else {
      cacheMisses.add(1);
      cacheHitRate.add(false);
    }

    check(res, {
      'Status is 200': (r) => r.status === 200,
      'Response time < 200ms': (r) => r.timings.duration < 200,
    });
  });

  sleep(0.1);

  // TEST 5: Check metrics endpoint
  group('Metrics API - Read-only monitoring', () => {
    const res = http.get(`${BASE_URL}/metrics`, {
      tags: { name: 'get_metrics' },
    });

    check(res, {
      'Metrics status is 200': (r) => r.status === 200,
      'Metrics has data': (r) => r.body && r.body.includes('hitRatio'),
    });

    if (res.status === 200) {
      try {
        const metrics = JSON.parse(res.body);
        console.log(
          `📊 Current Cache - Hits: ${metrics.summary.overallHits}, Misses: ${metrics.summary.overallMisses}`,
        );
      } catch (e) {
        // Ignore parse errors
      }
    }
  });

  sleep(1); // Wait between iterations to allow cache to settle
}

/**
 * After load test completes: Teardown and report summary
 */
export function teardown(data) {
  console.log('\n========== LOAD TEST SUMMARY ==========');
  console.log(`✅ Test completed successfully`);
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔢 Total Requests: ${cacheHits.value + cacheMisses.value}`);
  console.log(`💚 Cache Hits: ${cacheHits.value}`);
  console.log(`❌ Cache Misses: ${cacheMisses.value}`);

  if (cacheHits.value + cacheMisses.value > 0) {
    const hitRatio =
      ((cacheHits.value / (cacheHits.value + cacheMisses.value)) * 100).toFixed(2) + '%';
    console.log(`📈 Cache Hit Ratio: ${hitRatio}`);
  }

  console.log(`\n🎯 Response Time Metrics:`);
  console.log(`   - P95: Likely reported in k6 summary`);
  console.log(`   - P99: Likely reported in k6 summary`);
  console.log('\n✅ Check k6 summary above for detailed thresholds results');
  console.log('✅ If all thresholds passed → Cache is working as expected!');
  console.log('==========================================\n');
}
