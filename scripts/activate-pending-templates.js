#!/usr/bin/env node

/**
 * Simple Template Activation Script
 * 
 * This script activates all pending templates in the database
 * Run with: node scripts/activate-pending-templates.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateAllPendingTemplates() {
    try {
        console.log('🚀 Activating all pending templates...\n');
        
        // First, let's see what templates we have
        const allTemplates = await prisma.template.findMany({
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        console.log(`📊 Found ${allTemplates.length} total templates in database`);

        if (allTemplates.length === 0) {
            console.log('⚠️  No templates found in database. You may need to create templates first.');
            console.log('💡 Try creating a template through the web interface first.');
            return;
        }

        // Show current status
        console.log('\n📋 Current Template Status:');
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

        // Find pending templates
        const pendingTemplates = await prisma.template.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        console.log(`\n⏳ Found ${pendingTemplates.length} pending templates`);

        if (pendingTemplates.length === 0) {
            console.log('✅ No pending templates found. All templates are already active!');
            return;
        }

        // Show pending templates
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

        // Show final status
        console.log('\n📊 Final Status:');
        const finalStatusCounts = await prisma.template.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        finalStatusCounts.forEach(status => {
            const icon = status.status === 'APPROVED' ? '✅' : 
                        status.status === 'PENDING' ? '⏳' : 
                        status.status === 'REJECTED' ? '❌' : '📝';
            console.log(`  ${icon} ${status.status}: ${status._count.status} templates`);
        });

        const totalTemplates = await prisma.template.count();
        const activeTemplates = await prisma.template.count({
            where: { status: 'APPROVED' }
        });

        console.log(`\n🎉 Summary: ${activeTemplates}/${totalTemplates} templates are now active!`);

    } catch (error) {
        console.error('❌ Error activating templates:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function createSampleTemplates() {
    try {
        console.log('🚀 Creating sample templates...\n');
        
        // Get the first workspace
        const workspace = await prisma.workspace.findFirst();
        
        if (!workspace) {
            console.log('❌ No workspace found. Please create a workspace first.');
            return;
        }

        console.log(`📊 Using workspace: ${workspace.name} (ID: ${workspace.id})`);

        // Create sample templates
        const sampleTemplates = [
            {
                name: 'welcome_message',
                templateId: 'welcome_msg_001',
                status: 'APPROVED',
                category: 'UTILITY',
                language: 'en_US',
                components: JSON.stringify([
                    {
                        type: 'BODY',
                        text: 'Welcome to our service! We\'re excited to have you on board.'
                    }
                ]),
                workspaceId: workspace.id
            },
            {
                name: 'order_confirmation',
                templateId: 'order_conf_001',
                status: 'APPROVED',
                category: 'UTILITY',
                language: 'en_US',
                components: JSON.stringify([
                    {
                        type: 'BODY',
                        text: 'Your order #{{1}} has been confirmed and will be processed soon.'
                    }
                ]),
                workspaceId: workspace.id
            },
            {
                name: 'appointment_reminder',
                templateId: 'appt_rem_001',
                status: 'APPROVED',
                category: 'UTILITY',
                language: 'en_US',
                components: JSON.stringify([
                    {
                        type: 'BODY',
                        text: 'Reminder: You have an appointment scheduled for {{1}} at {{2}}.'
                    }
                ]),
                workspaceId: workspace.id
            }
        ];

        console.log('📝 Creating sample templates...');
        
        for (const templateData of sampleTemplates) {
            // Check if template already exists
            const existingTemplate = await prisma.template.findFirst({
                where: {
                    templateId: templateData.templateId,
                    workspaceId: workspace.id
                }
            });

            if (existingTemplate) {
                console.log(`⚠️  Template ${templateData.name} already exists, skipping...`);
                continue;
            }

            const template = await prisma.template.create({
                data: templateData
            });

            console.log(`✅ Created template: ${template.name} (${template.status})`);
        }

        console.log('\n🎉 Sample templates created successfully!');
        
        // Show final status
        const statusCounts = await prisma.template.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        console.log('\n📊 Template Status:');
        statusCounts.forEach(status => {
            const icon = status.status === 'APPROVED' ? '✅' : 
                        status.status === 'PENDING' ? '⏳' : 
                        status.status === 'REJECTED' ? '❌' : '📝';
            console.log(`  ${icon} ${status.status}: ${status._count.status} templates`);
        });

    } catch (error) {
        console.error('❌ Error creating sample templates:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'activate';

    switch (command) {
        case 'create':
            await createSampleTemplates();
            break;
        case 'activate':
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
    createSampleTemplates
};

