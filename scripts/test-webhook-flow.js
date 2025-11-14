const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Simulates the webhook flow to test chatbot behavior
 */
async function testWebhookFlow() {
    try {
        console.log('🧪 Simulating Webhook Flow\n');
        console.log('='.repeat(70));
        
        const testPhone = '08101126131';
        const normalizedPhone = `+${testPhone.startsWith('+') ? testPhone.substring(1) : testPhone}`;
        const trigger = 'go';
        
        // Step 1: Find workspace and chatbot
        console.log(`\n📋 Step 1: Finding workspace and chatbot...`);
        const chatbot = await prisma.chatbot.findFirst({
            where: {
                OR: [
                    { trigger: trigger },
                    { trigger: `/${trigger}` }
                ],
                publish: true
            },
            include: {
                workspace: true
            }
        });

        if (!chatbot) {
            console.log(`❌ No chatbot found`);
            return;
        }

        console.log(`✅ Chatbot: ${chatbot.name} (ID: ${chatbot.id})`);
        console.log(`✅ Workspace: ${chatbot.workspace.name} (ID: ${chatbot.workspace.id})`);

        // Step 2: Check conversation state BEFORE trigger
        console.log(`\n📋 Step 2: Conversation state BEFORE trigger...`);
        let conversation = await prisma.conversation.findFirst({
            where: {
                phone: normalizedPhone,
                workspaceId: chatbot.workspace.id
            }
        });

        if (conversation) {
            console.log(`   Conversation ID: ${conversation.id}`);
            console.log(`   Chatbot ID: ${conversation.chatbotId || 'None'}`);
            console.log(`   Current Node: ${conversation.currentNode || 'None'}`);
            console.log(`   Status: ${conversation.status}`);
        } else {
            console.log(`   No conversation found - will be created`);
        }

        // Step 3: Simulate sending trigger message
        console.log(`\n📋 Step 3: Simulating trigger message "${trigger}"...`);
        console.log(`   This would call: chatbotFlow(conversation, "${trigger}", false)`);
        
        const botConfig = JSON.parse(chatbot.bot);
        const messages = generateMessages(botConfig);
        
        console.log(`\n   Messages that would be generated:`);
        messages.forEach((msg, idx) => {
            console.log(`   ${idx + 1}. ${msg.nodeId} (${msg.type})`);
            console.log(`      Message: "${(msg.message || '').substring(0, 50)}${(msg.message || '').length > 50 ? '...' : ''}"`);
            if (msg.type === 'BUTTON_MESSAGE_NODE') {
                console.log(`      ✅ BUTTON MESSAGE - This should be the last node`);
                console.log(`      Buttons: ${msg.children?.length || 0}`);
            }
        });

        const lastMessageNode = messages[messages.length - 1];
        console.log(`\n   Last message node: ${lastMessageNode.nodeId} (${lastMessageNode.type})`);
        console.log(`   This should be set as currentNode after sending`);

        // Step 4: Check what happens when button is clicked
        console.log(`\n📋 Step 4: Simulating button click...`);
        
        if (lastMessageNode.type === 'BUTTON_MESSAGE_NODE' && lastMessageNode.children) {
            const firstButton = lastMessageNode.children[0];
            const buttonId = firstButton.nodeId || firstButton.id;
            const buttonTitle = firstButton.message || firstButton.title;
            
            console.log(`   Button clicked: "${buttonTitle}" (ID: ${buttonId})`);
            console.log(`   Interactive message: { type: 'button_reply', button_reply: { id: '${buttonId}', title: '${buttonTitle}' } }`);
            
            // Simulate handleInteractiveMsg
            const buttonNode = botConfig[buttonId];
            if (buttonNode) {
                console.log(`   ✅ Button node found: ${buttonNode.nodeId} (${buttonNode.type})`);
                console.log(`   Next node: ${buttonNode.next || 'END'}`);
                
                if (buttonNode.next) {
                    const nextNode = botConfig[buttonNode.next];
                    if (nextNode) {
                        console.log(`   ✅ Next node found: ${nextNode.nodeId} (${nextNode.type})`);
                        
                        const nextMessages = generateMessages(botConfig, buttonNode.next);
                        console.log(`   Messages that would be generated after button click:`);
                        nextMessages.forEach((msg, idx) => {
                            console.log(`   ${idx + 1}. ${msg.nodeId} (${msg.type})`);
                            if (msg.cta) {
                                console.log(`      ✅ CTA: "${msg.cta.buttonText}" → ${msg.cta.url}`);
                            }
                        });
                    }
                }
            }
        }

        // Step 5: Check actual conversation state
        console.log(`\n📋 Step 5: Current conversation state in database...`);
        conversation = await prisma.conversation.findFirst({
            where: {
                phone: normalizedPhone,
                workspaceId: chatbot.workspace.id
            }
        });

        if (conversation) {
            console.log(`   Conversation ID: ${conversation.id}`);
            console.log(`   Chatbot ID: ${conversation.chatbotId || 'None'} ${conversation.chatbotId === chatbot.id ? '✅' : '❌'}`);
            console.log(`   Current Node: ${conversation.currentNode || 'None'}`);
            console.log(`   Expected: ${lastMessageNode.nodeId}`);
            console.log(`   Match: ${conversation.currentNode === lastMessageNode.nodeId ? '✅' : '❌'}`);
            console.log(`   Status: ${conversation.status}`);
            console.log(`   Timeout: ${conversation.chatbotTimeout ? new Date(conversation.chatbotTimeout).toISOString() : 'None'}`);
        }

        // Step 6: Check recent messages
        console.log(`\n📋 Step 6: Recent messages in database...`);
        if (conversation) {
            const recentMessages = await prisma.message.findMany({
                where: {
                    conversationId: conversation.id
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5
            });

            console.log(`   Found ${recentMessages.length} recent messages:`);
            recentMessages.forEach((msg, idx) => {
                console.log(`   ${idx + 1}. [${msg.fromCustomer ? 'Customer' : 'Bot'}] ${msg.isBot ? '(Bot)' : ''}`);
                console.log(`      "${(msg.message || '').substring(0, 50)}${(msg.message || '').length > 50 ? '...' : ''}"`);
                console.log(`      Type: ${msg.type}, FileType: ${msg.fileType}`);
            });
        }

        // Step 7: Recommendations
        console.log(`\n📋 Step 7: Recommendations`);
        console.log('='.repeat(70));

        if (!conversation || !conversation.chatbotId) {
            console.log(`\n   ⚠️  Issue: Conversation has no chatbot ID`);
            console.log(`      Solution: Send the trigger "${trigger}" to initialize the chatbot`);
        } else if (conversation.currentNode !== lastMessageNode.nodeId) {
            console.log(`\n   ⚠️  Issue: Current node doesn't match expected button message node`);
            console.log(`      Current: ${conversation.currentNode || 'None'}`);
            console.log(`      Expected: ${lastMessageNode.nodeId}`);
            console.log(`      Solution: The currentNode might not be updating correctly after sending messages`);
        } else {
            console.log(`\n   ✅ Conversation state looks correct!`);
            console.log(`      If buttons still don't work, check server logs for:`);
            console.log(`      - "handleInteractiveMsg" messages`);
            console.log(`      - "New node found"`);
            console.log(`      - "sendCtaButtonMsg"`);
        }

        console.log(`\n🎉 Webhook flow simulation completed!\n`);
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Simplified versions of the actual functions
function generateMessages(bot, node = "start") {
    const botNodes = getBotNode(bot, node);
    
    // Filter out connector nodes
    const filterNodes = botNodes.filter(botNode => 
        botNode.type !== 'START_NODE' && 
        botNode.type !== 'BUTTON_NODE' &&
        botNode.type !== 'OPTION_NODE'
    );

    return filterNodes.map((botNode) => ({
        nodeId: botNode.nodeId,
        message: botNode.message,
        link: botNode.link,
        fileType: botNode.fileType || 'none',
        openChat: botNode.type === 'CHAT_WITH_AGENT',
        type: botNode.type,
        children: botNode.children,
        location: botNode.location || null,
        cta: botNode.cta || null,
        api: botNode.api || null
    }));
}

function getBotNode(bot, node = "start") {
    const botNode = bot[node];
    
    if (!botNode) {
        return [];
    }

    const botNodes = [botNode];

    if (botNode.needResponse) {
        return [...botNodes];
    }

    if (botNode.next) {
        return [...botNodes, ...getBotNode(bot, botNode.next)];
    }

    return [...botNodes];
}

// Run the test
testWebhookFlow();


