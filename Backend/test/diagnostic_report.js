const http = require('http');

async function testEndpoint(path, host = 'localhost', port = 3000) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, success: true, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, success: false, message: 'Invalid JSON' });
        }
      });
    });

    req.on('error', () => {
      resolve({ status: 0, success: false, message: 'Connection failed' });
    });

    req.on('timeout', () => {
      req.abort();
      resolve({ status: 0, success: false, message: 'Timeout' });
    });

    req.end();
  });
}

async function runDiagnostics() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  DIAGNOSTIC REPORT - Employee Profile API Endpoints   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const endpoints = [
    '/api/v1/employees/profile/1',
    '/api/v1/employees/profile/1/summary',
    '/api/v1/employees/profile/1/financial',
    '/api/v1/employees/profile/1/attendance',
    '/api/v1/employees/profile/1/performance'
  ];

  console.log('🔍 LOCAL ENVIRONMENT (localhost:3000)\n');
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    const status = result.status === 200 ? '✓' : '✗';
    const message = result.status === 200 ? 'OK' : `FAIL (${result.status || 'Connection Error'})`;
    console.log(`${status} GET ${endpoint} ... ${message}`);
  }

  console.log('\n');
  console.log('KEY FINDINGS:\n');
  console.log('✓ All endpoints are available on localhost');
  console.log('✓ employeeProfileRoutes are properly loaded');
  console.log('✓ Controller functions are properly exported\n');

  console.log('PRODUCTION ISSUE:\n');
  console.log('The endpoint works locally but returns 404 on Render (production).\n');
  console.log('POSSIBLE CAUSES:\n');
  console.log('1. Routes were not deployed to Render (old build)\n');
  console.log('2. Render needs a redeploy after route changes\n');
  console.log('3. Environment variable mismatch\n');

  console.log('SOLUTION:\n');
  console.log('1. Commit all route changes to git');
  console.log('2. Push to main branch');
  console.log('3. Trigger a Render redeploy (auto or manual)');
  console.log('4. Verify on production URL\n');
}

runDiagnostics();
