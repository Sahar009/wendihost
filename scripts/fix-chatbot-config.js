const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixChatbotConfig() {
    try {
        console.log('🔧 Fixing chatbot configurations...');
        
        // Find all chatbots without bot configuration
        const chatbots = await prisma.chatbot.findMany({
            where: {
                bot: null
            },
            select: {
                id: true,
                name: true,
                trigger: true,
                nodes: true,
                workspaceId: true
            }
        });

        console.log(`Found ${chatbots.length} chatbots without bot configuration`);

        for (const chatbot of chatbots) {
            console.log(`\n🔧 Fixing chatbot: ${chatbot.name} (ID: ${chatbot.id})`);
            
            try {
                // Parse the nodes
                const nodes = JSON.parse(chatbot.nodes || '[]');
                console.log(`   Nodes: ${nodes.length} found`);
                
                // Create a basic bot configuration from nodes
                const botConfig = {};
                
                // Process nodes to create bot flow
                nodes.forEach(node => {
                    if (node.id && node.data) {
                        botConfig[node.id] = {
                            nodeId: node.id,
                            type: 'TEXT_MESSAGE_NODE', // Always use TEXT_MESSAGE_NODE, not START_NODE
                            message: `Welcome to ${chatbot.name}! This is a default message.`,
                            needResponse: false,
                            next: null,
                            children: []
                        };
                    }
                });

                // If no nodes found, create a basic start node
                if (Object.keys(botConfig).length === 0) {
                    botConfig['start'] = {
                        nodeId: 'start',
                        type: 'TEXT_MESSAGE_NODE', // Always use TEXT_MESSAGE_NODE, not START_NODE
                        message: `Welcome to ${chatbot.name}! This is a default message.`,
                        needResponse: false,
                        next: null,
                        children: []
                    };
                }

                // Update the chatbot with bot configuration
                await prisma.chatbot.update({
                    where: { id: chatbot.id },
                    data: {
                        bot: JSON.stringify(botConfig),
                        publish: true // Also publish the chatbot
                    }
                });

                console.log(`   ✅ Fixed chatbot: ${chatbot.name}`);
                console.log(`   Bot config nodes: ${Object.keys(botConfig).join(', ')}`);
                
            } catch (error) {
                console.error(`   ❌ Error fixing chatbot ${chatbot.name}:`, error.message);
            }
        }

        console.log('\n🎉 Chatbot configuration fix completed!');
        
    } catch (error) {
        console.error('❌ Error fixing chatbot configurations:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixChatbotConfig();
