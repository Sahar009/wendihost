#!/usr/bin/env node

/**
 * Add Pending Templates Script
 * 
 * This script creates some pending templates for testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createPendingTemplates() {
    try {
        console.log('🚀 Creating pending templates for testing...\n');
        
        const workspace = await prisma.workspace.findFirst();
        
        if (!workspace) {
            console.log('❌ No workspace found. Please create a workspace first.');
            return;
        }

        console.log(`📊 Using workspace: ${workspace.name} (ID: ${workspace.id})`);

        const pendingTemplates = [
            {
                name: 'pending_welcome',
                templateId: 'pending_welcome_001',
                status: 'PENDING',
                category: 'UTILITY',
                language: 'en_US',
                components: JSON.stringify([
                    {
                        type: 'BODY',
                        text: 'Welcome! This template is pending approval.'
                    }
                ]),
                workspaceId: workspace.id
            },
            {
                name: 'pending_notification',
                templateId: 'pending_notif_001',
                status: 'PENDING',
                category: 'UTILITY',
                language: 'en_US',
                components: JSON.stringify([
                    {
                        type: 'BODY',
                        text: 'You have a new notification: {{1}}'
                    }
                ]),
                workspaceId: workspace.id
            },
            {
                name: 'pending_reminder',
                templateId: 'pending_rem_001',
                status: 'PENDING',
                category: 'UTILITY',
                language: 'en_US',
                components: JSON.stringify([
                    {
                        type: 'BODY',
                        text: 'Reminder: {{1}} is scheduled for {{2}}'
                    }
                ]),
                workspaceId: workspace.id
            }
        ];

        console.log('📝 Creating pending templates...');
        
        for (const templateData of pendingTemplates) {
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

            console.log(`⏳ Created pending template: ${template.name}`);
        }

        console.log('\n🎉 Pending templates created successfully!');
        
        // Show current status
        const statusCounts = await prisma.template.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        console.log('\n📊 Current Template Status:');
        statusCounts.forEach(status => {
            const icon = status.status === 'APPROVED' ? '✅' : 
                        status.status === 'PENDING' ? '⏳' : 
                        status.status === 'REJECTED' ? '❌' : '📝';
            console.log(`  ${icon} ${status.status}: ${status._count.status} templates`);
        });

    } catch (error) {
        console.error('❌ Error creating pending templates:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Handle script execution
if (require.main === module) {
    createPendingTemplates().catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { createPendingTemplates };

