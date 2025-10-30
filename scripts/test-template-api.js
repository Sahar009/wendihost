#!/usr/bin/env node

/**
 * Test Template API Script
 * 
 * This script tests the template API endpoint to see if it returns templates correctly
 */

const axios = require('axios');

async function testTemplateAPI() {
    try {
        console.log('🧪 Testing template API endpoint...\n');
        
        // You'll need to replace these with actual values from your session
        const workspaceId = 2; // From our database check
        const baseURL = 'http://localhost:3000'; // Adjust if your dev server runs on different port
        
        console.log(`📡 Testing: ${baseURL}/api/${workspaceId}/template/get?page=1&status=APPROVED`);
        
        const response = await axios.get(`${baseURL}/api/${workspaceId}/template/get?page=1&status=APPROVED`, {
            timeout: 5000,
            validateStatus: function (status) {
                return status < 500; // Accept any status code less than 500
            }
        });
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📋 Response Data:`, JSON.stringify(response.data, null, 2));
        
        if (response.data?.data?.length > 0) {
            console.log(`\n✅ Success! Found ${response.data.data.length} templates:`);
            response.data.data.forEach((template, index) => {
                console.log(`${index + 1}. ${template.name} (${template.status})`);
            });
        } else {
            console.log('\n⚠️  No templates returned from API');
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Connection refused. Make sure your development server is running on localhost:3000');
        } else if (error.response) {
            console.log(`❌ API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Alternative: Test with curl command
function showCurlCommand() {
    console.log('\n🔧 Alternative: Test with curl command:');
    console.log('curl -X GET "http://localhost:3000/api/2/template/get?page=1&status=APPROVED" \\');
    console.log('  -H "Accept: application/json" \\');
    console.log('  -H "Cookie: your-session-cookie"');
    console.log('\n💡 Note: You may need to include your session cookie for authentication');
}

if (require.main === module) {
    testTemplateAPI().then(() => {
        showCurlCommand();
    });
}

module.exports = { testTemplateAPI };


