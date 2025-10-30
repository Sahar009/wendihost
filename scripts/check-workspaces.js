#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWorkspaces() {
    try {
        console.log('🔍 Checking workspaces in database...\n');
        
        const workspaces = await prisma.workspace.findMany({
            select: {
                id: true,
                name: true,
                workspaceId: true
            }
        });
        
        console.log(`📊 Total workspaces: ${workspaces.length}`);
        
        if (workspaces.length === 0) {
            console.log('❌ No workspaces found in database!');
            return;
        }
        
        console.log('\n📋 All Workspaces:');
        workspaces.forEach((workspace, index) => {
            console.log(`${index + 1}. ID: ${workspace.id} - Name: ${workspace.name} - WorkspaceId: ${workspace.workspaceId}`);
        });
        
        // Check templates for each workspace
        console.log('\n🔍 Templates per workspace:');
        for (const workspace of workspaces) {
            const templates = await prisma.template.findMany({
                where: { workspaceId: workspace.id },
                select: { id: true, name: true, status: true }
            });
            
            console.log(`\n🏢 Workspace ${workspace.id} (${workspace.name}):`);
            if (templates.length === 0) {
                console.log('  ❌ No templates');
            } else {
                templates.forEach(template => {
                    const statusIcon = template.status === 'APPROVED' ? '✅' : 
                                     template.status === 'PENDING' ? '⏳' : 
                                     template.status === 'REJECTED' ? '❌' : '📝';
                    console.log(`  ${statusIcon} ${template.name} (${template.status})`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkWorkspaces();


