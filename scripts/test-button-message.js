const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testButtonMessage() {
    try {
        console.log('🧪 Testing Button Message Chatbot...\n');
        
        const testPhone = '08101126131';
        const trigger = 'go';
        const normalizedPhone = `+${testPhone.startsWith('+') ? testPhone.substring(1) : testPhone}`;
        
        // Step 1: Find the chatbot with trigger "go"
        console.log(`📋 Step 1: Finding chatbot with trigger "${trigger}"...`);
        const chatbot = await prisma.chatbot.findFirst({
            where: {
                trigger: {
                    in: [trigger, `/${trigger}`, trigger.toLowerCase(), `/${trigger.toLowerCase()}`]
                },
                publish: true
            },
            select: {
                id: true,
                name: true,
                trigger: true,
                bot: true,
                publish: true,
                workspaceId: true
            }
        });

        if (!chatbot) {
            console.log(`❌ No published chatbot found with trigger "${trigger}"`);
            console.log('   Searching for any chatbot with "go" in trigger...');
            
            const allChatbots = await prisma.chatbot.findMany({
                where: {
                    trigger: {
                        contains: 'go',
                        mode: 'insensitive'
                    }
                },
                select: {
                    id: true,
                    name: true,
                    trigger: true,
                    publish: true
                }
            });
            
            if (allChatbots.length > 0) {
                console.log('\n   Found chatbots with "go" in trigger:');
                allChatbots.forEach(bot => {
                    console.log(`   - ${bot.name}: trigger="${bot.trigger}", published=${bot.publish}`);
                });
            }
            return;
        }

        console.log(`✅ Found chatbot: ${chatbot.name} (ID: ${chatbot.id})`);
        console.log(`   Trigger: ${chatbot.trigger}`);
        console.log(`   Published: ${chatbot.publish}`);
        console.log(`   Workspace ID: ${chatbot.workspaceId}`);

        // Step 2: Parse bot configuration
        console.log(`\n📋 Step 2: Analyzing bot configuration...`);
        if (!chatbot.bot) {
            console.log('❌ Bot configuration is missing!');
            return;
        }

        const botConfig = JSON.parse(chatbot.bot);
        const nodeKeys = Object.keys(botConfig);
        console.log(`   Bot nodes: ${nodeKeys.join(', ')}`);

        // Find start node
        const startNode = botConfig['start'];
        if (!startNode) {
            console.log('❌ No start node found in bot configuration');
            return;
        }

        console.log(`\n   Start Node:`);
        console.log(`     - Node ID: ${startNode.nodeId}`);
        console.log(`     - Type: ${startNode.type}`);
        console.log(`     - Message: ${startNode.message?.substring(0, 100)}`);
        console.log(`     - Next: ${startNode.next || 'null'}`);
        console.log(`     - Children: ${startNode.children?.length || 0}`);

        // Find button message node - trace through entire flow
        let buttonMessageNode = null;
        let currentNode = startNode;
        let visitedNodes = new Set();
        let path = [];
        
        console.log(`\n   Tracing flow to find Button Message Node...`);
        
        while (currentNode && currentNode.next && !visitedNodes.has(currentNode.nodeId)) {
            visitedNodes.add(currentNode.nodeId);
            path.push(currentNode.nodeId);
            
            const nextNodeId = currentNode.next;
            const nextNode = botConfig[nextNodeId];
            
            if (!nextNode) {
                console.log(`     ⚠️  Next node "${nextNodeId}" not found in bot config`);
                break;
            }
            
            console.log(`\n   Node: ${nextNode.nodeId}`);
            console.log(`     - Type: ${nextNode.type}`);
            console.log(`     - Message: ${nextNode.message?.substring(0, 80) || 'No message'}${nextNode.message?.length > 80 ? '...' : ''}`);
            console.log(`     - Children: ${nextNode.children?.length || 0}`);
            console.log(`     - Next: ${nextNode.next || 'null'}`);
            
            if (nextNode.type === 'BUTTON_MESSAGE_NODE') {
                buttonMessageNode = nextNode;
                console.log(`     ✅ This is the Button Message Node!`);
                break;
            }
            
            currentNode = nextNode;
        }
        
        if (buttonMessageNode) {
            console.log(`\n   ✅ Found Button Message Node at: ${buttonMessageNode.nodeId}`);
            console.log(`     - Message: "${buttonMessageNode.message}"`);
            console.log(`     - Button Children: ${buttonMessageNode.children?.length || 0}`);
            
            if (buttonMessageNode.children && buttonMessageNode.children.length > 0) {
                console.log(`\n     Buttons:`);
                buttonMessageNode.children.forEach((child, index) => {
                    const btnId = child.nodeId || child.id || `button-${index}`;
                    const btnText = child.message || child.title || 'No message';
                    console.log(`       ${index + 1}. "${btnText}" (ID: ${btnId})`);
                });
            } else {
                console.log(`     ⚠️  No button children found!`);
            }
        } else {
            console.log(`\n   ⚠️  No Button Message Node found in the flow`);
            console.log(`   Searched path: ${path.join(' → ')}`);
            
            // Search all nodes for button message node
            console.log(`\n   Searching all nodes for Button Message Node...`);
            Object.entries(botConfig).forEach(([nodeId, node]) => {
                if (node.type === 'BUTTON_MESSAGE_NODE') {
                    console.log(`     ✅ Found Button Message Node: ${nodeId}`);
                    console.log(`        Message: "${node.message}"`);
                    console.log(`        Children: ${node.children?.length || 0}`);
                    buttonMessageNode = node;
                }
            });
        }

        // Step 3: Find or create conversation
        console.log(`\n📋 Step 3: Finding conversation for ${normalizedPhone}...`);
        const workspace = await prisma.workspace.findUnique({
            where: { id: chatbot.workspaceId },
            select: {
                id: true,
                name: true,
                phone: true,
                phoneId: true,
                accessToken: true
            }
        });

        if (!workspace) {
            console.log(`❌ Workspace ${chatbot.workspaceId} not found`);
            return;
        }

        console.log(`   Workspace: ${workspace.name}`);
        console.log(`   WhatsApp Phone: ${workspace.phone || 'Not connected'}`);
        console.log(`   Phone ID: ${workspace.phoneId || 'Not set'}`);
        console.log(`   Access Token: ${workspace.accessToken ? 'Set' : 'Missing'}`);

        if (!workspace.phone || !workspace.accessToken) {
            console.log(`\n❌ Workspace is not connected to WhatsApp!`);
            console.log(`   Please connect WhatsApp first before testing.`);
            return;
        }

        let conversation = await prisma.conversation.findFirst({
            where: {
                phone: normalizedPhone,
                workspaceId: workspace.id
            }
        });

        if (!conversation) {
            console.log(`   Creating new conversation...`);
            conversation = await prisma.conversation.create({
                data: {
                    phone: normalizedPhone,
                    workspaceId: workspace.id,
                    status: 'open',
                    read: false
                }
            });
            console.log(`   ✅ Created conversation ID: ${conversation.id}`);
        } else {
            console.log(`   ✅ Found existing conversation ID: ${conversation.id}`);
            console.log(`     Status: ${conversation.status}`);
            console.log(`     Current Chatbot ID: ${conversation.chatbotId || 'None'}`);
            console.log(`     Current Node: ${conversation.currentNode || 'None'}`);
        }

        // Step 4: Test the chatbot flow
        console.log(`\n📋 Step 4: Testing chatbot flow...`);
        console.log(`   Simulating message: "${trigger}"`);
        
        // Import chatbot flow (we'll need to require it)
        // For now, let's just check the structure
        console.log(`\n   Expected flow:`);
        console.log(`   1. User sends: "${trigger}"`);
        console.log(`   2. Chatbot should trigger`);
        console.log(`   3. Start node message should be sent`);
        
        if (buttonMessageNode) {
            console.log(`   4. Button message should be sent with ${buttonMessageNode.children?.length || 0} buttons`);
            if (buttonMessageNode.children && buttonMessageNode.children.length > 0) {
                buttonMessageNode.children.forEach((btn, idx) => {
                    console.log(`      Button ${idx + 1}: "${btn.message || btn.title || 'No text'}"`);
                });
            }
        }

        // Step 5: Check conversation state
        console.log(`\n📋 Step 5: Current conversation state...`);
        const updatedConversation = await prisma.conversation.findUnique({
            where: { id: conversation.id },
            select: {
                id: true,
                status: true,
                chatbotId: true,
                currentNode: true,
                chatbotTimeout: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        message: true,
                        fromCustomer: true,
                        isBot: true,
                        createdAt: true
                    }
                }
            }
        });

        if (updatedConversation) {
            console.log(`   Status: ${updatedConversation.status}`);
            console.log(`   Chatbot ID: ${updatedConversation.chatbotId || 'None'}`);
            console.log(`   Current Node: ${updatedConversation.currentNode || 'None'}`);
            console.log(`   Recent Messages: ${updatedConversation.messages.length}`);
            updatedConversation.messages.forEach((msg, idx) => {
                const direction = msg.fromCustomer ? '← Customer' : '→ Bot';
                const type = msg.isBot ? '🤖 Bot' : '👤 Agent';
                console.log(`     ${idx + 1}. ${direction} ${type}: ${msg.message?.substring(0, 50) || 'No message'}`);
            });
        }

        // Step 6: Summary and recommendations
        console.log(`\n📋 Step 6: Test Summary`);
        console.log(`\n✅ Configuration Check:`);
        console.log(`   - Chatbot found: ✅`);
        console.log(`   - Bot config exists: ${chatbot.bot ? '✅' : '❌'}`);
        console.log(`   - Start node exists: ${startNode ? '✅' : '❌'}`);
        console.log(`   - Button message node: ${buttonMessageNode ? '✅' : '❌'}`);
        console.log(`   - Buttons configured: ${buttonMessageNode?.children?.length > 0 ? '✅' : '❌'}`);
        console.log(`   - Workspace connected: ${workspace.phone && workspace.accessToken ? '✅' : '❌'}`);
        console.log(`   - Conversation exists: ${conversation ? '✅' : '❌'}`);

        if (buttonMessageNode && buttonMessageNode.children && buttonMessageNode.children.length > 0) {
            console.log(`\n📝 Button Message Details:`);
            console.log(`   Message: "${buttonMessageNode.message}"`);
            console.log(`   Number of buttons: ${buttonMessageNode.children.length}`);
            buttonMessageNode.children.forEach((btn, idx) => {
                const btnId = btn.nodeId || btn.id || `button-${idx}`;
                const btnText = btn.message || btn.title || 'No text';
                console.log(`   Button ${idx + 1}: "${btnText}" (ID: ${btnId})`);
            });
        }

        console.log(`\n💡 To test manually:`);
        console.log(`   1. Send "${trigger}" to ${workspace.phone} from ${normalizedPhone}`);
        console.log(`   2. You should receive: "${startNode.message}"`);
        if (buttonMessageNode) {
            console.log(`   3. Then you should receive button message: "${buttonMessageNode.message}"`);
            console.log(`   4. With ${buttonMessageNode.children?.length || 0} interactive buttons`);
        }

        console.log(`\n🎉 Test script completed!\n`);
        
    } catch (error) {
        console.error('❌ Error testing button message:', error);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testButtonMessage();

