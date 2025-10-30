#!/usr/bin/env node

/**
 * Template Sync and Activation Script
 * 
 * This script syncs templates from Facebook API and activates pending ones
 * Run with: node scripts/sync-and-activate-templates.js
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Facebook API configuration
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

async function syncTemplatesFromFacebook(workspace) {
    try {
        console.log(`🔄 Syncing templates for workspace: ${workspace.name}`);
        
        if (!workspace.accessToken || !workspace.whatsappId) {
            console.log(`⚠️  Workspace ${workspace.name} missing access token or WhatsApp ID`);
            return [];
        }

        const client = facebookAuth(workspace.accessToken);
        const response = await client.get(`${workspace.whatsappId}/message_templates?fields=id,name,status,category,language,components,quality_score&limit=50`);
        
        const templates = response.data.data || [];
        console.log(`📊 Found ${templates.length} templates from Facebook API`);
        
        return templates;
    } catch (error) {
        console.error(`❌ Error syncing templates for workspace ${workspace.name}:`, error.response?.data || error.message);
        return [];
    }
}

async function saveTemplatesToDatabase(workspaceId, templates) {
    try {
        const savedTemplates = [];
        
        for (const template of templates) {
            // Check if template already exists
            const existingTemplate = await prisma.template.findFirst({
                where: {
                    templateId: template.id,
                    workspaceId: workspaceId
                }
            });

            if (existingTemplate) {
                // Update existing template
                const updatedTemplate = await prisma.template.update({
                    where: { id: existingTemplate.id },
                    data: {
                        name: template.name,
                        status: template.status,
                        category: template.category,
                        language: template.language,
                        components: JSON.stringify(template.components || []),
                        updatedAt: new Date()
                    }
                });
                savedTemplates.push(updatedTemplate);
            } else {
                // Create new template
                const newTemplate = await prisma.template.create({
                    data: {
                        name: template.name,
                        templateId: template.id,
                        status: template.status,
                        category: template.category,
                        language: template.language,
                        components: JSON.stringify(template.components || []),
                        workspaceId: workspaceId
                    }
                });
                savedTemplates.push(newTemplate);
            }
        }
        
        return savedTemplates;
    } catch (error) {
        console.error('❌ Error saving templates to database:', error);
        return [];
    }
}

async function activatePendingTemplates(workspaceId) {
    try {
        console.log(`🔄 Activating pending templates for workspace ${workspaceId}...`);
        
        const updateResult = await prisma.template.updateMany({
            where: {
                status: 'PENDING',
                workspaceId: workspaceId
            },
            data: {
                status: 'APPROVED',
                updatedAt: new Date()
            }
        });

        console.log(`✅ Activated ${updateResult.count} pending templates`);
        return updateResult.count;
    } catch (error) {
        console.error('❌ Error activating templates:', error);
        return 0;
    }
}

async function syncAndActivateAllTemplates() {
    try {
        console.log('🚀 Starting template sync and activation...\n');
        
        // Get all workspaces
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

        let totalSynced = 0;
        let totalActivated = 0;

        for (const workspace of workspaces) {
            console.log(`\n🏢 Processing workspace: ${workspace.name} (ID: ${workspace.id})`);
            
            // Sync templates from Facebook
            const facebookTemplates = await syncTemplatesFromFacebook(workspace);
            
            if (facebookTemplates.length > 0) {
                // Save templates to database
                const savedTemplates = await saveTemplatesToDatabase(workspace.id, facebookTemplates);
                totalSynced += savedTemplates.length;
                
                console.log(`💾 Saved ${savedTemplates.length} templates to database`);
                
                // Show template statuses
                const statusCounts = savedTemplates.reduce((acc, template) => {
                    acc[template.status] = (acc[template.status] || 0) + 1;
                    return acc;
                }, {});
                
                Object.entries(statusCounts).forEach(([status, count]) => {
                    const icon = status === 'APPROVED' ? '✅' : 
                                status === 'PENDING' ? '⏳' : 
                                status === 'REJECTED' ? '❌' : '📝';
                    console.log(`  ${icon} ${status}: ${count} templates`);
                });
                
                // Activate pending templates
                const activatedCount = await activatePendingTemplates(workspace.id);
                totalActivated += activatedCount;
            }
        }

        console.log(`\n🎉 Sync and activation complete!`);
        console.log(`📊 Total templates synced: ${totalSynced}`);
        console.log(`✅ Total templates activated: ${totalActivated}`);

        // Final status summary
        await showFinalStatus();

    } catch (error) {
        console.error('❌ Error in sync and activation:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function showFinalStatus() {
    try {
        console.log('\n📊 Final Template Status Summary:');
        
        const statusCounts = await prisma.template.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        statusCounts.forEach(status => {
            const icon = status.status === 'APPROVED' ? '✅' : 
                        status.status === 'PENDING' ? '⏳' : 
                        status.status === 'REJECTED' ? '❌' : '📝';
            console.log(`  ${icon} ${status.status}: ${status._count.status} templates`);
        });

        const totalTemplates = await prisma.template.count();
        const activeTemplates = await prisma.template.count({
            where: { status: 'APPROVED' }
        });

        console.log(`\n📈 Summary: ${activeTemplates}/${totalTemplates} templates are active`);

    } catch (error) {
        console.error('❌ Error showing final status:', error);
    }
}

async function activateAllPendingTemplates() {
    try {
        console.log('🔄 Activating all pending templates...\n');
        
        const updateResult = await prisma.template.updateMany({
            where: {
                status: 'PENDING'
            },
            data: {
                status: 'APPROVED',
                updatedAt: new Date()
            }
        });

        console.log(`✅ Successfully activated ${updateResult.count} pending templates!`);
        
        await showFinalStatus();

    } catch (error) {
        console.error('❌ Error activating templates:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'sync';

    switch (command) {
        case 'activate':
            await activateAllPendingTemplates();
            break;
        case 'sync':
        default:
            await syncAndActivateAllTemplates();
            break;
    }
}

// Handle script execution
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = {
    syncAndActivateAllTemplates,
    activateAllPendingTemplates,
    syncTemplatesFromFacebook,
    saveTemplatesToDatabase
};
