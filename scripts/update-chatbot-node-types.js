const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateChatbotNodeTypes() {
    try {
        console.log('🔧 Updating chatbot node types...');
        
        // Find all chatbots with bot configuration
        const chatbots = await prisma.chatbot.findMany({
            where: {
                bot: {
                    not: null
                }
            },
            select: {
                id: true,
                name: true,
                trigger: true,
                bot: true
            }
        });

        console.log(`Found ${chatbots.length} chatbots with bot configuration`);

        for (const chatbot of chatbots) {
            console.log(`\n🔧 Updating chatbot: ${chatbot.name} (ID: ${chatbot.id})`);
            
            try {
                // Parse the bot configuration
                const botConfig = JSON.parse(chatbot.bot);
                console.log(`   Current bot nodes: ${Object.keys(botConfig).join(', ')}`);
                
                let updated = false;
                
                // Update all nodes to use TEXT_MESSAGE_NODE instead of START_NODE
                Object.keys(botConfig).forEach(nodeId => {
                    const node = botConfig[nodeId];
                    if (node.type === 'START_NODE') {
                        console.log(`   Updating node ${nodeId} from START_NODE to TEXT_MESSAGE_NODE`);
                        node.type = 'TEXT_MESSAGE_NODE';
                        updated = true;
                    }
                });

                if (updated) {
                    // Update the chatbot with corrected bot configuration
                    await prisma.chatbot.update({
                        where: { id: chatbot.id },
                        data: {
                            bot: JSON.stringify(botConfig)
                        }
                    });

                    console.log(`   ✅ Updated chatbot: ${chatbot.name}`);
                } else {
                    console.log(`   ℹ️ No updates needed for chatbot: ${chatbot.name}`);
                }
                
            } catch (error) {
                console.error(`   ❌ Error updating chatbot ${chatbot.name}:`, error.message);
            }
        }

        console.log('\n🎉 Chatbot node type update completed!');
        
    } catch (error) {
        console.error('❌ Error updating chatbot node types:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the update
updateChatbotNodeTypes();


