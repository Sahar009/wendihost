const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateChatbotFlow() {
    try {
        console.log('🧪 Simulating chatbot flow...');
        
        // Find the chatbot
        const chatbot = await prisma.chatbot.findFirst({
            where: {
                trigger: '/start'
            },
            select: {
                id: true,
                name: true,
                trigger: true,
                bot: true,
                publish: true
            }
        });

        if (!chatbot) {
            console.log('❌ No chatbot found with trigger /start');
            return;
        }

        console.log(`✅ Found chatbot: ${chatbot.name} (ID: ${chatbot.id})`);

        if (chatbot.bot) {
            const botConfig = JSON.parse(chatbot.bot);
            console.log(`   Bot nodes: ${Object.keys(botConfig).join(', ')}`);
            
            // Simulate the generateMessages function
            const startNode = botConfig['start'];
            if (startNode) {
                console.log(`\n🔍 Simulating generateMessages for node: start`);
                console.log(`   Node ID: ${startNode.nodeId}`);
                console.log(`   Type: ${startNode.type}`);
                console.log(`   Message: ${startNode.message}`);
                console.log(`   Need Response: ${startNode.needResponse}`);
                console.log(`   Next: ${startNode.next}`);
                
                // Check if this node would be filtered out
                if (startNode.type === 'START_NODE') {
                    console.log('   ❌ This node would be filtered out by generateMessages!');
                } else {
                    console.log('   ✅ This node would be included in messages!');
                    
                    // Simulate message generation
                    const message = {
                        nodeId: startNode.nodeId,
                        message: startNode.message,
                        link: startNode.link,
                        fileType: startNode.fileType,
                        openChat: startNode.type === 'CHAT_WITH_AGENT',
                        type: startNode.type,
                        children: startNode.children
                    };
                    
                    console.log(`\n📤 Generated message:`, message);
                }
            }
        }

        console.log('\n🎉 Simulation completed!');
        
    } catch (error) {
        console.error('❌ Error simulating chatbot flow:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the simulation
simulateChatbotFlow();


