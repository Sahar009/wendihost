#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function copyTemplatesToDefaultWorkspace() {
    try {
        console.log('🔄 Copying templates to Default Workspace...\n');
        
        // Get templates from workspace 2 (develop)
        const sourceTemplates = await prisma.template.findMany({
            where: { workspaceId: 2 }
        });
        
        console.log(`📊 Found ${sourceTemplates.length} templates in workspace 2 (develop)`);
        
        if (sourceTemplates.length === 0) {
            console.log('❌ No templates found in source workspace');
            return;
        }
        
        // Copy templates to workspace 1 (Default Workspace)
        let copiedCount = 0;
        
        for (const template of sourceTemplates) {
            // Check if template already exists in target workspace
            const existingTemplate = await prisma.template.findFirst({
                where: {
                    templateId: template.templateId,
                    workspaceId: 1
                }
            });
            
            if (existingTemplate) {
                console.log(`⚠️  Template ${template.name} already exists in Default Workspace, skipping...`);
                continue;
            }
            
            // Create new template in workspace 1
            const newTemplate = await prisma.template.create({
                data: {
                    name: template.name,
                    templateId: template.templateId,
                    status: template.status,
                    category: template.category,
                    language: template.language,
                    components: template.components,
                    workspaceId: 1
                }
            });
            
            console.log(`✅ Copied template: ${newTemplate.name} (${newTemplate.status})`);
            copiedCount++;
        }
        
        console.log(`\n🎉 Successfully copied ${copiedCount} templates to Default Workspace!`);
        
        // Verify the copy
        const defaultWorkspaceTemplates = await prisma.template.findMany({
            where: { workspaceId: 1 },
            select: { id: true, name: true, status: true }
        });
        
        console.log(`\n📊 Default Workspace now has ${defaultWorkspaceTemplates.length} templates:`);
        defaultWorkspaceTemplates.forEach(template => {
            const statusIcon = template.status === 'APPROVED' ? '✅' : 
                             template.status === 'PENDING' ? '⏳' : 
                             template.status === 'REJECTED' ? '❌' : '📝';
            console.log(`  ${statusIcon} ${template.name} (${template.status})`);
        });
        
    } catch (error) {
        console.error('❌ Error copying templates:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Alternative: Update all templates to be in both workspaces
async function ensureTemplatesInAllWorkspaces() {
    try {
        console.log('🔄 Ensuring templates exist in all workspaces...\n');
        
        const workspaces = await prisma.workspace.findMany({
            select: { id: true, name: true }
        });
        
        console.log(`📊 Found ${workspaces.length} workspaces`);
        
        // Get all unique templates (by templateId)
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
        
        console.log(`📋 Found ${uniqueTemplates.length} unique templates`);
        
        // Ensure each template exists in each workspace
        for (const workspace of workspaces) {
            console.log(`\n🏢 Processing workspace ${workspace.id} (${workspace.name}):`);
            
            for (const template of uniqueTemplates) {
                const existingTemplate = await prisma.template.findFirst({
                    where: {
                        templateId: template.templateId,
                        workspaceId: workspace.id
                    }
                });
                
                if (!existingTemplate) {
                    const newTemplate = await prisma.template.create({
                        data: {
                            name: template.name,
                            templateId: template.templateId,
                            status: template.status,
                            category: template.category,
                            language: template.language,
                            components: template.components,
                            workspaceId: workspace.id
                        }
                    });
                    
                    console.log(`  ✅ Added ${newTemplate.name} (${newTemplate.status})`);
                } else {
                    console.log(`  ⚠️  ${template.name} already exists`);
                }
            }
        }
        
        console.log('\n🎉 All templates are now available in all workspaces!');
        
    } catch (error) {
        console.error('❌ Error ensuring templates in all workspaces:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'copy';

    switch (command) {
        case 'ensure':
            await ensureTemplatesInAllWorkspaces();
            break;
        case 'copy':
        default:
            await copyTemplatesToDefaultWorkspace();
            break;
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { copyTemplatesToDefaultWorkspace, ensureTemplatesInAllWorkspaces };


