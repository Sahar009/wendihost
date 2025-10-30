#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTemplates() {
    try {
        console.log('🔍 Checking templates in database...\n');
        
        const templates = await prisma.template.findMany({
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        
        console.log(`📊 Total templates: ${templates.length}`);
        
        if (templates.length === 0) {
            console.log('❌ No templates found in database!');
            return;
        }
        
        console.log('\n📋 All Templates:');
        templates.forEach((template, index) => {
            const statusIcon = template.status === 'APPROVED' ? '✅' : 
                             template.status === 'PENDING' ? '⏳' : 
                             template.status === 'REJECTED' ? '❌' : '📝';
            console.log(`${index + 1}. ${statusIcon} ${template.name} - Status: ${template.status} - Workspace: ${template.workspace.name}`);
        });
        
        const approvedTemplates = templates.filter(t => t.status === 'APPROVED');
        console.log(`\n✅ Approved templates: ${approvedTemplates.length}`);
        
        const pendingTemplates = templates.filter(t => t.status === 'PENDING');
        console.log(`⏳ Pending templates: ${pendingTemplates.length}`);
        
        // Check if templates have proper components
        console.log('\n🔍 Checking template components:');
        templates.forEach((template, index) => {
            try {
                const components = JSON.parse(template.components);
                console.log(`${index + 1}. ${template.name}: ${components.length} components`);
                components.forEach(comp => {
                    console.log(`   - ${comp.type}: ${comp.text ? comp.text.substring(0, 50) + '...' : 'No text'}`);
                });
            } catch (e) {
                console.log(`${index + 1}. ${template.name}: Invalid components JSON`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTemplates();


