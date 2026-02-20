const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          path: path,
          hasData: data.length > 0
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('\n🔍 Testing Local Backend Endpoints\n');
  console.log('http://localhost:3000/api/v1/employees/profile/1/summary');
  
  try {
    const result = await testEndpoint('/api/v1/employees/profile/1/summary');
    console.log(`Status: ${result.status}`);
    console.log(`Path: ${result.path}`);
    console.log(`Has Data: ${result.hasData}\n`);
  } catch (error) {
    console.log('⚠️ Backend is not running on localhost:3000');
    console.log(`Error: ${error.message}\n`);
  }
}

runTests();
