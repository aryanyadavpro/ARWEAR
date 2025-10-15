// Test the actual signup and signin API endpoints
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPIEndpoints() {
  console.log('🧪 Testing Authentication API Endpoints...\n');
  
  const baseUrl = 'localhost';
  const port = 3000;
  const testEmail = `api.test.${Date.now()}@example.com`;
  const testPassword = 'APITest123';
  
  try {
    // Test 1: Signup API
    console.log('📝 Testing SIGNUP API endpoint...');
    
    const signupOptions = {
      hostname: baseUrl,
      port: port,
      path: '/api/auth/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const signupData = {
      email: testEmail,
      password: testPassword,
      firstName: 'API',
      lastName: 'Test'
    };
    
    const signupResponse = await makeRequest(signupOptions, signupData);
    
    console.log(`   Status: ${signupResponse.status}`);
    console.log(`   Response:`, signupResponse.body);
    
    if (signupResponse.status === 201) {
      console.log('✅ Signup API working correctly\n');
      
      // Test 2: Try to signup with same email (should fail)
      console.log('🔄 Testing duplicate signup (should fail)...');
      const duplicateResponse = await makeRequest(signupOptions, signupData);
      console.log(`   Status: ${duplicateResponse.status}`);
      console.log(`   Response:`, duplicateResponse.body);
      
      if (duplicateResponse.status === 400) {
        console.log('✅ Duplicate signup prevention working correctly\n');
      } else {
        console.log('❌ Duplicate signup should have failed\n');
      }
      
      // Test 3: Signin API
      console.log('🔐 Testing SIGNIN API endpoint...');
      
      const signinOptions = {
        hostname: baseUrl,
        port: port,
        path: '/api/auth/signin',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const signinData = {
        email: testEmail,
        password: testPassword
      };
      
      const signinResponse = await makeRequest(signinOptions, signinData);
      
      console.log(`   Status: ${signinResponse.status}`);
      console.log(`   Response:`, signinResponse.body);
      
      if (signinResponse.status === 200) {
        console.log('✅ Signin API working correctly\n');
        
        // Test 4: Wrong password signin
        console.log('🔒 Testing signin with wrong password (should fail)...');
        const wrongPasswordData = {
          email: testEmail,
          password: 'WrongPassword'
        };
        
        const wrongPasswordResponse = await makeRequest(signinOptions, wrongPasswordData);
        console.log(`   Status: ${wrongPasswordResponse.status}`);
        console.log(`   Response:`, wrongPasswordResponse.body);
        
        if (wrongPasswordResponse.status === 401) {
          console.log('✅ Wrong password protection working correctly\n');
        } else {
          console.log('❌ Wrong password should have failed\n');
        }
        
        // Test 5: Non-existent user signin
        console.log('👤 Testing signin with non-existent user (should fail)...');
        const nonExistentData = {
          email: 'nonexistent@example.com',
          password: 'password123'
        };
        
        const nonExistentResponse = await makeRequest(signinOptions, nonExistentData);
        console.log(`   Status: ${nonExistentResponse.status}`);
        console.log(`   Response:`, nonExistentResponse.body);
        
        if (nonExistentResponse.status === 401) {
          console.log('✅ Non-existent user protection working correctly\n');
        } else {
          console.log('❌ Non-existent user signin should have failed\n');
        }
        
      } else {
        console.log('❌ Signin API failed\n');
      }
      
    } else {
      console.log('❌ Signup API failed\n');
    }
    
    console.log('🎉 API endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error('   Make sure the Next.js server is running on http://localhost:3000');
  }
}

testAPIEndpoints().catch(console.error);