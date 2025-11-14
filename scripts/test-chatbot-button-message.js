const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testChatbotButtonMessage() {
    try {
        console.log('🧪 Testing Chatbot Button Message Flow\n');
        console.log('=' .repeat(60));
        
        const testPhone = '08101126131';
        const trigger = 'go';
        const normalizedPhone = `+${testPhone.startsWith('+') ? testPhone.substring(1) : testPhone}`;
        
        // Step 1: Find chatbot
        console.log(`\n📋 Step 1: Finding chatbot with trigger "${trigger}"...`);
        const chatbot = await prisma.chatbot.findFirst({
            where: {
                OR: [
                    { trigger: trigger },
                    { trigger: `/${trigger}` },
                    { trigger: trigger.toLowerCase() },
                    { trigger: `/${trigger.toLowerCase()}` }
                ],
                publish: true
            },
            include: {
                workspace: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        phoneId: true,
                        accessToken: true
                    }
                }
            }
        });

        if (!chatbot) {
            console.log(`❌ No published chatbot found with trigger "${trigger}"`);
            
            // Search for any chatbot with "go"
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

        console.log(`✅ Found chatbot: ${chatbot.name}`);
        console.log(`   ID: ${chatbot.id}`);
        console.log(`   Trigger: ${chatbot.trigger}`);
        console.log(`   Published: ${chatbot.publish}`);
        console.log(`   Workspace: ${chatbot.workspace.name} (ID: ${chatbot.workspace.id})`);

        // Step 2: Check workspace connection
        console.log(`\n📋 Step 2: Checking workspace WhatsApp connection...`);
        const workspace = chatbot.workspace;
        
        if (!workspace.phone || !workspace.accessToken || !workspace.phoneId) {
            console.log(`❌ Workspace is not connected to WhatsApp!`);
            console.log(`   Phone: ${workspace.phone || 'Missing'}`);
            console.log(`   Phone ID: ${workspace.phoneId || 'Missing'}`);
            console.log(`   Access Token: ${workspace.accessToken ? 'Set' : 'Missing'}`);
            console.log(`\n   Please connect WhatsApp first in the dashboard.`);
            return;
        }

        console.log(`✅ Workspace is connected`);
        console.log(`   WhatsApp Phone: ${workspace.phone}`);
        console.log(`   Phone ID: ${workspace.phoneId}`);

        // Step 3: Analyze bot configuration
        console.log(`\n📋 Step 3: Analyzing bot configuration...`);
        if (!chatbot.bot) {
            console.log(`❌ Bot configuration is missing!`);
            return;
        }

        const botConfig = JSON.parse(chatbot.bot);
        const nodeKeys = Object.keys(botConfig);
        console.log(`   Total nodes: ${nodeKeys.length}`);
        console.log(`   Node IDs: ${nodeKeys.join(', ')}`);

        // Find start node
        const startNode = botConfig['start'];
        if (!startNode) {
            console.log(`❌ No start node found!`);
            return;
        }

        console.log(`\n   Start Node:`);
        console.log(`     ID: ${startNode.nodeId}`);
        console.log(`     Type: ${startNode.type}`);
        console.log(`     Message: "${startNode.message?.substring(0, 80)}${startNode.message?.length > 80 ? '...' : ''}"`);
        console.log(`     Next: ${startNode.next || 'null'}`);

        // Find button message node
        let buttonMessageNode = null;
        let buttonNodePath = [];

        if (startNode.next) {
            let currentNode = botConfig[startNode.next];
            let path = [startNode.nodeId, startNode.next];
            
            while (currentNode) {
                console.log(`\n   Node: ${currentNode.nodeId}`);
                console.log(`     Type: ${currentNode.type}`);
                console.log(`     Message: "${currentNode.message?.substring(0, 80) || 'No message'}${currentNode.message?.length > 80 ? '...' : ''}"`);
                console.log(`     Children: ${currentNode.children?.length || 0}`);
                
                if (currentNode.type === 'BUTTON_MESSAGE_NODE') {
                    buttonMessageNode = currentNode;
                    buttonNodePath = path;
                    console.log(`     ✅ This is the Button Message Node!`);
                    break;
                }
                
                if (currentNode.next) {
                    path.push(currentNode.next);
                    currentNode = botConfig[currentNode.next];
                } else {
                    break;
                }
            }
        }

        if (buttonMessageNode) {
            console.log(`\n   📋 Button Message Node Details:`);
            console.log(`     Node ID: ${buttonMessageNode.nodeId}`);
            console.log(`     Message: "${buttonMessageNode.message}"`);
            console.log(`     Number of buttons: ${buttonMessageNode.children?.length || 0}`);
            
            if (buttonMessageNode.children && buttonMessageNode.children.length > 0) {
                console.log(`\n     Buttons:`);
                buttonMessageNode.children.forEach((child, index) => {
                    const btnId = child.nodeId || child.id || `button-${index}`;
                    const btnText = child.message || child.title || 'No text';
                    console.log(`       ${index + 1}. "${btnText}" (ID: ${btnId})`);
                });
            } else {
                console.log(`     ⚠️  WARNING: No button children found!`);
                console.log(`     This means buttons won't be sent.`);
            }
        } else {
            console.log(`\n   ⚠️  No Button Message Node found in the flow`);
        }

        // Step 4: Check conversation
        console.log(`\n📋 Step 4: Checking conversation...`);
        let conversation = await prisma.conversation.findFirst({
            where: {
                phone: normalizedPhone,
                workspaceId: workspace.id
            }
        });

        if (conversation) {
            console.log(`✅ Found conversation ID: ${conversation.id}`);
            console.log(`   Status: ${conversation.status}`);
            console.log(`   Current Chatbot: ${conversation.chatbotId || 'None'}`);
            console.log(`   Current Node: ${conversation.currentNode || 'None'}`);
        } else {
            console.log(`   No existing conversation (will be created when message is sent)`);
        }

        // Step 5: Test Summary
        console.log(`\n📋 Step 5: Test Summary`);
        console.log('=' .repeat(60));
        
        const checks = {
            'Chatbot found': !!chatbot,
            'Chatbot published': chatbot?.publish || false,
            'Bot config exists': !!chatbot?.bot,
            'Start node exists': !!startNode,
            'Button message node found': !!buttonMessageNode,
            'Buttons configured': buttonMessageNode?.children?.length > 0 || false,
            'Workspace connected': !!(workspace.phone && workspace.accessToken),
            'Phone ID set': !!workspace.phoneId
        };

        Object.entries(checks).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });

        // Step 6: Recommendations
        console.log(`\n📋 Step 6: Testing Instructions`);
        console.log('=' .repeat(60));
        
        if (!checks['Workspace connected']) {
            console.log(`\n❌ CRITICAL: Workspace is not connected to WhatsApp!`);
            console.log(`   Please connect WhatsApp in the dashboard first.`);
        } else if (!checks['Button message node found']) {
            console.log(`\n⚠️  WARNING: No Button Message Node found in the chatbot flow.`);
            console.log(`   Make sure your chatbot has a Button Message node after the start node.`);
        } else if (!checks['Buttons configured']) {
            console.log(`\n⚠️  WARNING: Button Message Node has no button children!`);
            console.log(`   Make sure you've added buttons to the Button Message node.`);
        } else {
            console.log(`\n✅ All checks passed! Ready to test.`);
            console.log(`\n📱 To test manually:`);
            console.log(`   1. Send "${trigger}" to ${workspace.phone} from ${normalizedPhone}`);
            console.log(`   2. You should receive: "${startNode.message?.substring(0, 50)}..."`);
            if (buttonMessageNode) {
                console.log(`   3. Then you should receive: "${buttonMessageNode.message?.substring(0, 50)}..."`);
                console.log(`   4. With ${buttonMessageNode.children.length} interactive buttons:`);
                buttonMessageNode.children.forEach((btn, idx) => {
                    console.log(`      - "${btn.message || btn.title || 'Button ' + (idx + 1)}"`);
                });
            }
        }

        // Step 7: Check recent messages
        if (conversation) {
            console.log(`\n📋 Step 7: Recent messages in conversation...`);
            const recentMessages = await prisma.message.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    message: true,
                    fromCustomer: true,
                    isBot: true,
                    createdAt: true
                }
            });

            if (recentMessages.length > 0) {
                console.log(`   Found ${recentMessages.length} recent messages:`);
                recentMessages.forEach((msg, idx) => {
                    const direction = msg.fromCustomer ? '← Customer' : '→ Bot';
                    const type = msg.isBot ? '🤖' : '👤';
                    const time = new Date(msg.createdAt).toLocaleTimeString();
                    console.log(`     ${idx + 1}. ${direction} ${type} [${time}]: ${msg.message?.substring(0, 60) || 'No message'}${msg.message?.length > 60 ? '...' : ''}`);
                });
            } else {
                console.log(`   No messages yet in this conversation`);
            }
        }

        console.log(`\n🎉 Test script completed!\n`);
        
    } catch (error) {
        console.error('\n❌ Error running test:', error);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testChatbotButtonMessage();

