#!/usr/bin/env node

/**
 * Submit Templates to Facebook Script
 * 
 * This script submits our local templates to Facebook's WhatsApp Business API
 * so they can be used as proper templates
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

async function submitTemplateToFacebook(workspace, template) {
    try {
        console.log(`🔄 Submitting template "${template.name}" to Facebook...`);
        
        const components = JSON.parse(template.components);
        
        const payload = {
            messaging_product: "whatsapp",
            name: template.name,
            category: template.category,
            language: template.language,
            components: components
        };
        
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        const client = facebookAuth(workspace.accessToken);
        const response = await client.post(`${workspace.whatsappId}/message_templates`, payload);
        
        console.log(`✅ Template "${template.name}" submitted successfully!`);
        console.log('Response:', response.data);
        
        return { success: true, data: response.data };
        
    } catch (error) {
        console.error(`❌ Error submitting template "${template.name}":`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

async function submitAllTemplatesToFacebook() {
    try {
        console.log('🚀 Submitting all templates to Facebook...\n');
        
        // Get workspaces with Facebook integration
        const workspaces = await prisma.workspace.findMany({
            where: {
                accessToken: {
                    not: null
                },
                whatsappId: {
                    not: null
                }
            },
            select: {
                id: true,
                name: true,
                accessToken: true,
                whatsappId: true
            }
        });

        console.log(`📊 Found ${workspaces.length} workspaces with Facebook integration`);

        if (workspaces.length === 0) {
            console.log('❌ No workspaces with Facebook integration found');
            console.log('💡 Make sure to connect your Facebook account in the dashboard');
            return;
        }

        // Get unique templates (by templateId)
        const allTemplates = await prisma.template.findMany({
            select: { 
                templateId: true, 
                name: true, 
                status: true, 
                category: true, 
                language: true, 
                components: true 
            }
        });

        // Get unique templates
        const uniqueTemplates = allTemplates.reduce((acc, template) => {
            if (!acc.find(t => t.templateId === template.templateId)) {
                acc.push(template);
            }
            return acc;
        }, []);

        console.log(`📋 Found ${uniqueTemplates.length} unique templates to submit`);

        let successCount = 0;
        let errorCount = 0;

        // Submit templates for each workspace
        for (const workspace of workspaces) {
            console.log(`\n🏢 Processing workspace: ${workspace.name} (ID: ${workspace.id})`);
            
            for (const template of uniqueTemplates) {
                const result = await submitTemplateToFacebook(workspace, template);
                
                if (result.success) {
                    successCount++;
                    
                    // Update template status in database
                    await prisma.template.updateMany({
                        where: {
                            templateId: template.templateId,
                            workspaceId: workspace.id
                        },
                        data: {
                            status: 'SUBMITTED',
                            updatedAt: new Date()
                        }
                    });
                    
                } else {
                    errorCount++;
                    
                    // Check if it's a duplicate error
                    if (result.error?.error?.error_user_msg?.includes('already exists')) {
                        console.log(`⚠️  Template "${template.name}" already exists in Facebook, updating status to SUBMITTED`);
                        
                        await prisma.template.updateMany({
                            where: {
                                templateId: template.templateId,
                                workspaceId: workspace.id
                            },
                            data: {
                                status: 'SUBMITTED',
                                updatedAt: new Date()
                            }
                        });
                        
                        successCount++;
                        errorCount--;
                    }
                }
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\n🎉 Submission complete!`);
        console.log(`✅ Successfully submitted: ${successCount} templates`);
        console.log(`❌ Failed to submit: ${errorCount} templates`);

        // Show final status
        const statusCounts = await prisma.template.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        console.log('\n📊 Final Template Status:');
        statusCounts.forEach(status => {
            const icon = status.status === 'SUBMITTED' ? '📤' : 
                        status.status === 'APPROVED' ? '✅' : 
                        status.status === 'PENDING' ? '⏳' : 
                        status.status === 'REJECTED' ? '❌' : '📝';
            console.log(`  ${icon} ${status.status}: ${status._count.status} templates`);
        });

    } catch (error) {
        console.error('❌ Error submitting templates:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function checkFacebookTemplates(workspaceId) {
    try {
        console.log(`🔍 Checking Facebook templates for workspace ${workspaceId}...\n`);
        
        const workspace = await prisma.workspace.findUnique({
            where: { id: parseInt(workspaceId) },
            select: {
                id: true,
                name: true,
                accessToken: true,
                whatsappId: true
            }
        });

        if (!workspace || !workspace.accessToken || !workspace.whatsappId) {
            console.log('❌ Workspace not found or missing Facebook integration');
            return;
        }

        console.log(`📊 Checking templates for workspace: ${workspace.name}`);

        const client = facebookAuth(workspace.accessToken);
        const response = await client.get(`${workspace.whatsappId}/message_templates?fields=id,name,status,category,language&limit=50`);
        
        const templates = response.data.data || [];
        
        console.log(`📋 Found ${templates.length} templates in Facebook:`);
        
        if (templates.length === 0) {
            console.log('⚠️  No templates found in Facebook API');
        } else {
            templates.forEach((template, index) => {
                const statusIcon = template.status === 'APPROVED' ? '✅' : 
                                 template.status === 'PENDING' ? '⏳' : 
                                 template.status === 'REJECTED' ? '❌' : '📝';
                console.log(`${index + 1}. ${statusIcon} ${template.name} (${template.status}) - ${template.category}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking Facebook templates:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'submit';

    switch (command) {
        case 'check':
            const workspaceId = args[1];
            if (!workspaceId) {
                console.log('❌ Please provide a workspace ID');
                console.log('Usage: node scripts/submit-templates-to-facebook.js check <workspaceId>');
                process.exit(1);
            }
            await checkFacebookTemplates(workspaceId);
            break;
        case 'submit':
        default:
            await submitAllTemplatesToFacebook();
            break;
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { submitAllTemplatesToFacebook, checkFacebookTemplates };


