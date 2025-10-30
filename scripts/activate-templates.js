#!/usr/bin/env node

/**
 * Template Activation Script
 * 
 * This script activates all pending templates by updating their status to APPROVED
 * Run with: node scripts/activate-templates.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateAllPendingTemplates() {
    try {
        console.log('🔍 Searching for pending templates...');
        
        // Find all templates with PENDING status
        const pendingTemplates = await prisma.template.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true,
                        whatsappId: true
                    }
                }
            }
        });

        console.log(`📊 Found ${pendingTemplates.length} pending templates`);

        if (pendingTemplates.length === 0) {
            console.log('✅ No pending templates found. All templates are already active!');
            return;
        }

        // Display pending templates
        console.log('\n📋 Pending Templates:');
        pendingTemplates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.name} (${template.category}) - Workspace: ${template.workspace.name}`);
        });

        // Update all pending templates to APPROVED
        console.log('\n🔄 Activating templates...');
        
        const updateResult = await prisma.template.updateMany({
            where: {
                status: 'PENDING'
            },
            data: {
                status: 'APPROVED',
                updatedAt: new Date()
            }
        });

        console.log(`✅ Successfully activated ${updateResult.count} templates!`);

        // Verify the update
        const remainingPending = await prisma.template.count({
            where: {
                status: 'PENDING'
            }
        });

        console.log(`📊 Remaining pending templates: ${remainingPending}`);

        if (remainingPending === 0) {
            console.log('🎉 All templates are now active!');
        }

    } catch (error) {
        console.error('❌ Error activating templates:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function activateTemplatesByWorkspace(workspaceId) {
    try {
        console.log(`🔍 Searching for pending templates in workspace ${workspaceId}...`);
        
        // Find pending templates for specific workspace
        const pendingTemplates = await prisma.template.findMany({
            where: {
                status: 'PENDING',
                workspaceId: parseInt(workspaceId)
            },
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true,
                        whatsappId: true
                    }
                }
            }
        });

        console.log(`📊 Found ${pendingTemplates.length} pending templates in workspace ${workspaceId}`);

        if (pendingTemplates.length === 0) {
            console.log('✅ No pending templates found in this workspace!');
            return;
        }

        // Display pending templates
        console.log('\n📋 Pending Templates:');
        pendingTemplates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.name} (${template.category})`);
        });

        // Update pending templates to APPROVED
        console.log('\n🔄 Activating templates...');
        
        const updateResult = await prisma.template.updateMany({
            where: {
                status: 'PENDING',
                workspaceId: parseInt(workspaceId)
            },
            data: {
                status: 'APPROVED',
                updatedAt: new Date()
            }
        });

        console.log(`✅ Successfully activated ${updateResult.count} templates in workspace ${workspaceId}!`);

    } catch (error) {
        console.error('❌ Error activating templates:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function listTemplateStatuses() {
    try {
        console.log('📊 Template Status Summary:');
        
        const statusCounts = await prisma.template.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        statusCounts.forEach(status => {
            console.log(`  ${status.status}: ${status._count.status} templates`);
        });

        // Show templates by workspace
        const templatesByWorkspace = await prisma.template.findMany({
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                workspaceId: 'asc'
            }
        });

        console.log('\n📋 All Templates by Workspace:');
        const workspaceGroups = templatesByWorkspace.reduce((acc, template) => {
            const workspaceName = template.workspace.name;
            if (!acc[workspaceName]) {
                acc[workspaceName] = [];
            }
            acc[workspaceName].push(template);
            return acc;
        }, {});

        Object.entries(workspaceGroups).forEach(([workspaceName, templates]) => {
            console.log(`\n  🏢 ${workspaceName}:`);
            templates.forEach(template => {
                const statusIcon = template.status === 'APPROVED' ? '✅' : 
                                 template.status === 'PENDING' ? '⏳' : 
                                 template.status === 'REJECTED' ? '❌' : '📝';
                console.log(`    ${statusIcon} ${template.name} (${template.category}) - ${template.status}`);
            });
        });

    } catch (error) {
        console.error('❌ Error listing template statuses:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'list':
            await listTemplateStatuses();
            break;
        case 'workspace':
            const workspaceId = args[1];
            if (!workspaceId) {
                console.error('❌ Please provide a workspace ID');
                console.log('Usage: node scripts/activate-templates.js workspace <workspaceId>');
                process.exit(1);
            }
            await activateTemplatesByWorkspace(workspaceId);
            break;
        case 'all':
        default:
            await activateAllPendingTemplates();
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
    activateAllPendingTemplates,
    activateTemplatesByWorkspace,
    listTemplateStatuses
};

