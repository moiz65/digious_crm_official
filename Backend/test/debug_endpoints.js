const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('Testing: /api/v1/employees/profile/1/summary\n');
  const result = await testEndpoint('/api/v1/employees/profile/1/summary');
  console.log('Status:', result.status);
  console.log('Response:', result.body);
}

test().catch(err => console.log('❌ Backend not running:', err.message));
