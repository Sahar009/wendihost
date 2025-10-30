#!/usr/bin/env node

/**
 * WhatsApp Business Configuration Checker
 * 
 * This script checks your WhatsApp Business API configuration
 * and helps identify issues with display name approval
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const FACEBOOK_BASE_ENDPOINT = 'https://graph.facebook.com/v18.0/';

function facebookAuth(accessToken) {
    return axios.create({
        baseURL: FACEBOOK_BASE_ENDPOINT,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
}

async function checkWhatsAppBusinessConfig(workspaceId) {
    try {
        console.log(`🔍 Checking WhatsApp Business configuration for workspace ${workspaceId}...\n`);
        
        const workspace = await prisma.workspace.findUnique({
            where: { id: parseInt(workspaceId) },
            select: {
                id: true,
                name: true,
                accessToken: true,
                whatsappId: true,
                phoneId: true,
                businessId: true,
                phone: true
            }
        });

        if (!workspace) {
            console.log('❌ Workspace not found');
            return;
        }

        console.log(`📊 Workspace: ${workspace.name} (ID: ${workspace.id})`);
        console.log(`📱 Phone: ${workspace.phone}`);
        console.log(`🔑 Access Token: ${workspace.accessToken ? 'Present' : 'Missing'}`);
        console.log(`📞 WhatsApp ID: ${workspace.whatsappId || 'Missing'}`);
        console.log(`📞 Phone ID: ${workspace.phoneId || 'Missing'}`);
        console.log(`🏢 Business ID: ${workspace.businessId || 'Missing'}`);

        if (!workspace.accessToken || !workspace.whatsappId) {
            console.log('\n❌ Missing required Facebook integration');
            console.log('💡 Go to Dashboard → Link Meta Account to connect your WhatsApp Business API');
            return;
        }

        // Check WhatsApp Business Account Info
        console.log('\n🔍 Checking WhatsApp Business Account...');
        
        try {
            const client = facebookAuth(workspace.accessToken);
            const accountResponse = await client.get(`${workspace.whatsappId}?fields=id,name,display_phone_number,quality_rating,account_review_status`);
            
            console.log('✅ WhatsApp Business Account Info:');
            console.log(`   ID: ${accountResponse.data.id}`);
            console.log(`   Name: ${accountResponse.data.name}`);
            console.log(`   Display Phone: ${accountResponse.data.display_phone_number}`);
            console.log(`   Quality Rating: ${accountResponse.data.quality_rating || 'Not rated'}`);
            console.log(`   Review Status: ${accountResponse.data.account_review_status || 'Unknown'}`);
            
        } catch (error) {
            console.log('❌ Error fetching WhatsApp Business account info:');
            console.log(`   ${error.response?.data?.error?.message || error.message}`);
        }

        // Check Phone Number Info
        if (workspace.phoneId) {
            console.log('\n🔍 Checking Phone Number Info...');
            
            try {
                const client = facebookAuth(workspace.accessToken);
                const phoneResponse = await client.get(`${workspace.phoneId}?fields=id,display_phone_number,verified_name,quality_rating,status`);
                
                console.log('✅ Phone Number Info:');
                console.log(`   ID: ${phoneResponse.data.id}`);
                console.log(`   Display Phone: ${phoneResponse.data.display_phone_number}`);
                console.log(`   Verified Name: ${phoneResponse.data.verified_name || 'Not verified'}`);
                console.log(`   Quality Rating: ${phoneResponse.data.quality_rating || 'Not rated'}`);
                console.log(`   Status: ${phoneResponse.data.status || 'Unknown'}`);
                
                if (!phoneResponse.data.verified_name) {
                    console.log('\n⚠️  Display name not verified - this is likely causing error 131037');
                    console.log('💡 You need to verify your business display name in Facebook Business Manager');
                }
                
            } catch (error) {
                console.log('❌ Error fetching phone number info:');
                console.log(`   ${error.response?.data?.error?.message || error.message}`);
            }
        }

        // Test message sending capability
        console.log('\n🧪 Testing message sending capability...');
        
        try {
            const testPhone = '1234567890'; // Dummy phone for testing API access
            const testBody = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: testPhone,
                type: "text",
                text: { body: "Test message" }
            };
            
            const client = facebookAuth(workspace.accessToken);
            const testResponse = await client.post(`${workspace.phoneId}/messages`, testBody);
            
            console.log('✅ Message API is accessible');
            
        } catch (error) {
            console.log('❌ Message API test failed:');
            const errorData = error.response?.data?.error;
            if (errorData) {
                console.log(`   Code: ${errorData.code}`);
                console.log(`   Title: ${errorData.title}`);
                console.log(`   Message: ${errorData.message}`);
                
                if (errorData.code === 131037) {
                    console.log('\n🚨 FOUND THE ISSUE: Display name approval required!');
                    console.log('💡 Solutions:');
                    console.log('   1. Go to Facebook Business Manager');
                    console.log('   2. Complete your WhatsApp Business profile');
                    console.log('   3. Submit display name for verification');
                    console.log('   4. Wait for approval (24-48 hours)');
                }
            } else {
                console.log(`   ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error checking configuration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function showFixInstructions() {
    console.log('\n📋 How to Fix Display Name Approval Issue:\n');
    
    console.log('1. 🌐 Go to Facebook Business Manager:');
    console.log('   https://business.facebook.com\n');
    
    console.log('2. 📱 Navigate to WhatsApp Business:');
    console.log('   - Go to Business Settings');
    console.log('   - Click on "WhatsApp Business Accounts"');
    console.log('   - Select your business account\n');
    
    console.log('3. ✏️  Complete Business Profile:');
    console.log('   - Add business name (display name)');
    console.log('   - Add business description');
    console.log('   - Add business category');
    console.log('   - Add business address');
    console.log('   - Add business website');
    console.log('   - Upload business logo\n');
    
    console.log('4. 📤 Submit for Verification:');
    console.log('   - Click "Submit for Review"');
    console.log('   - Wait for approval (24-48 hours)\n');
    
    console.log('5. 🔄 Alternative Quick Fix:');
    console.log('   - Use a simple display name like "Support"');
    console.log('   - Avoid business-specific terms');
    console.log('   - Test if messages work with simple name\n');
    
    console.log('6. 📞 Contact Facebook Support:');
    console.log('   - If issues persist, contact Facebook Business Support');
    console.log('   - Provide your business verification documents\n');
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'check';

    switch (command) {
        case 'instructions':
            await showFixInstructions();
            break;
        case 'check':
        default:
            const workspaceId = args[1] || '1';
            await checkWhatsAppBusinessConfig(workspaceId);
            await showFixInstructions();
            break;
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { checkWhatsAppBusinessConfig, showFixInstructions };


