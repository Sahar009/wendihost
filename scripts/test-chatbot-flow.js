const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testChatbotFlow() {
    try {
        console.log('🧪 Testing chatbot flow...');
        
        // Find the chatbot we just fixed
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
        console.log(`   Trigger: ${chatbot.trigger}`);
        console.log(`   Published: ${chatbot.publish}`);
        console.log(`   Bot config: ${chatbot.bot ? 'Present' : 'Missing'}`);

        if (chatbot.bot) {
            const botConfig = JSON.parse(chatbot.bot);
            console.log(`   Bot nodes: ${Object.keys(botConfig).join(', ')}`);
            
            // Check if start node exists
            if (botConfig.start) {
                console.log(`   Start node message: ${botConfig.start.message}`);
            } else {
                console.log('   ❌ No start node found in bot config');
            }
        }

        // Test conversation
        const conversation = await prisma.conversation.findFirst({
            where: {
                phone: '+2348101126131',
                workspaceId: 3
            }
        });

        if (conversation) {
            console.log(`\n📱 Found conversation: ${conversation.id}`);
            console.log(`   Phone: ${conversation.phone}`);
            console.log(`   Status: ${conversation.status}`);
            console.log(`   Chatbot ID: ${conversation.chatbotId}`);
            console.log(`   Current Node: ${conversation.currentNode}`);
        }

        console.log('\n🎉 Test completed!');
        
    } catch (error) {
        console.error('❌ Error testing chatbot flow:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testChatbotFlow();


