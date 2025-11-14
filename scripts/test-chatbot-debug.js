const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Comprehensive chatbot flow debugging script
 * Tests the entire flow from trigger to button click to CTA
 */
async function testChatbotFlowDebug() {
    try {
        console.log('🔍 Chatbot Flow Debugging Script\n');
        console.log('='.repeat(70));
        
        const testPhone = '08101126131';
        const normalizedPhone = `+${testPhone.startsWith('+') ? testPhone.substring(1) : testPhone}`;
        const trigger = 'go';
        
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
            return;
        }

        console.log(`✅ Found chatbot: ${chatbot.name} (ID: ${chatbot.id})`);
        console.log(`   Workspace: ${chatbot.workspace.name} (ID: ${chatbot.workspace.id})`);
        console.log(`   Connected: ${chatbot.workspace.phone ? 'Yes' : 'No'}`);

        if (!chatbot.bot) {
            console.log(`❌ Bot configuration is missing!`);
            return;
        }

        const botConfig = JSON.parse(chatbot.bot);
        console.log(`   Bot nodes: ${Object.keys(botConfig).length} nodes`);

        // Step 2: Check conversation state
        console.log(`\n📋 Step 2: Checking conversation state...`);
        let conversation = await prisma.conversation.findFirst({
            where: {
                phone: normalizedPhone,
                workspaceId: chatbot.workspace.id
            }
        });

        if (conversation) {
            console.log(`✅ Found conversation: ${conversation.id}`);
            console.log(`   Status: ${conversation.status}`);
            console.log(`   Chatbot ID: ${conversation.chatbotId || 'None'}`);
            console.log(`   Current Node: ${conversation.currentNode || 'None'}`);
            console.log(`   Timeout: ${conversation.chatbotTimeout ? new Date(conversation.chatbotTimeout).toISOString() : 'None'}`);
            console.log(`   Expired: ${conversation.chatbotTimeout ? (Number(conversation.chatbotTimeout) < Date.now() ? 'Yes ⚠️' : 'No') : 'N/A'}`);
        } else {
            console.log(`ℹ️  No conversation found - will be created on first message`);
        }

        // Step 3: Analyze bot structure
        console.log(`\n📋 Step 3: Analyzing bot structure...`);
        console.log('='.repeat(70));
        
        const startNode = botConfig['start'];
        if (!startNode) {
            console.log(`❌ No start node found!`);
            return;
        }

        console.log(`\n📍 Start Node: ${startNode.nodeId || 'start'}`);
        console.log(`   Next: ${startNode.next || 'END'}`);

        // Trace the flow
        let currentNode = startNode;
        let path = ['start'];
        let step = 1;

        console.log(`\n   Flow Path:`);
        while (currentNode && currentNode.next) {
            const nextNodeId = currentNode.next;
            const nextNode = botConfig[nextNodeId];
            
            if (!nextNode) {
                console.log(`   ${step}. ${nextNodeId} → ❌ NODE NOT FOUND`);
                break;
            }

            path.push(nextNodeId);
            step++;

            console.log(`   ${step}. ${nextNode.nodeId} (${nextNode.type})`);
            console.log(`      Message: "${(nextNode.message || '').substring(0, 60)}${(nextNode.message || '').length > 60 ? '...' : ''}"`);
            console.log(`      Next: ${nextNode.next || 'END'}`);
            
            if (nextNode.type === 'BUTTON_MESSAGE_NODE') {
                console.log(`      ✅ BUTTON MESSAGE NODE`);
                console.log(`      Buttons: ${nextNode.children?.length || 0}`);
                if (nextNode.children && nextNode.children.length > 0) {
                    nextNode.children.forEach((btn, idx) => {
                        const btnId = btn.nodeId || btn.id;
                        const btnText = btn.message || btn.title || 'No text';
                        console.log(`         ${idx + 1}. "${btnText}" (ID: ${btnId})`);
                        
                        // Check what happens when this button is clicked
                        const buttonNode = botConfig[btnId];
                        if (buttonNode) {
                            console.log(`            → Button Node: ${buttonNode.nodeId} (${buttonNode.type})`);
                            console.log(`            → Next: ${buttonNode.next || 'END'}`);
                            
                            if (buttonNode.next) {
                                const afterButtonNode = botConfig[buttonNode.next];
                                if (afterButtonNode) {
                                    console.log(`            → After Click: ${afterButtonNode.nodeId} (${afterButtonNode.type})`);
                                    if (afterButtonNode.cta) {
                                        console.log(`               ✅ CTA: "${afterButtonNode.cta.buttonText}" → ${afterButtonNode.cta.url}`);
                                    }
                                    if (afterButtonNode.fileType && afterButtonNode.fileType !== 'none') {
                                        console.log(`               ✅ File: ${afterButtonNode.fileType} - ${afterButtonNode.link ? 'Has link' : 'No link'}`);
                                    }
                                }
                            }
                        } else {
                            console.log(`            → ❌ Button node not found in bot config!`);
                        }
                    });
                }
            }
            
            if (nextNode.cta) {
                console.log(`      ✅ CTA Button: "${nextNode.cta.buttonText}" → ${nextNode.cta.url}`);
            }
            
            if (nextNode.fileType && nextNode.fileType !== 'none') {
                console.log(`      ✅ File: ${nextNode.fileType} - ${nextNode.link ? 'Has link' : 'No link'}`);
            }

            currentNode = nextNode;
        }

        // Step 4: Simulate button click
        console.log(`\n📋 Step 4: Simulating button click flow...`);
        console.log('='.repeat(70));

        // Find button message node
        const buttonMessageNode = Object.values(botConfig).find(
            node => node.type === 'BUTTON_MESSAGE_NODE'
        );

        if (!buttonMessageNode) {
            console.log(`❌ No button message node found`);
            return;
        }

        console.log(`\n   Button Message Node: ${buttonMessageNode.nodeId}`);
        console.log(`   Current Node in Conversation: ${conversation?.currentNode || 'None'}`);
        
        // Check if current node matches button message node
        if (conversation?.currentNode === buttonMessageNode.nodeId) {
            console.log(`   ✅ Current node matches button message node`);
        } else {
            console.log(`   ⚠️  Current node (${conversation?.currentNode || 'None'}) does NOT match button message node (${buttonMessageNode.nodeId})`);
            console.log(`   This might be why button clicks aren't working!`);
        }

        // Simulate clicking first button
        if (buttonMessageNode.children && buttonMessageNode.children.length > 0) {
            const firstButton = buttonMessageNode.children[0];
            const buttonId = firstButton.nodeId || firstButton.id;
            const buttonTitle = firstButton.message || firstButton.title || 'No text';
            
            console.log(`\n   Simulating click on: "${buttonTitle}"`);
            console.log(`   Button ID: ${buttonId}`);
            
            // Check what handleInteractiveMsg would do
            console.log(`\n   🔍 What handleInteractiveMsg would do:`);
            console.log(`      1. Receives: { type: 'button_reply', button_reply: { id: '${buttonId}', title: '${buttonTitle}' } }`);
            console.log(`      2. Looks for button node: bot['${buttonId}']`);
            
            const buttonNode = botConfig[buttonId];
            if (buttonNode) {
                console.log(`      3. ✅ Found button node: ${buttonNode.nodeId} (${buttonNode.type})`);
                console.log(`      4. Gets next node: ${buttonNode.next || 'END'}`);
                
                if (buttonNode.next) {
                    const nextNode = botConfig[buttonNode.next];
                    if (nextNode) {
                        console.log(`      5. ✅ Next node found: ${nextNode.nodeId} (${nextNode.type})`);
                        console.log(`         Message: "${nextNode.message || '(no message)'}"`);
                        
                        if (nextNode.cta) {
                            console.log(`         ✅ CTA configured: "${nextNode.cta.buttonText}" → ${nextNode.cta.url}`);
                            console.log(`         📤 Should send CTA button message`);
                        } else {
                            console.log(`         ❌ No CTA configured on this node`);
                        }
                        
                        if (nextNode.fileType && nextNode.fileType !== 'none') {
                            console.log(`         ✅ File configured: ${nextNode.fileType}`);
                            if (!nextNode.link) {
                                console.log(`         ⚠️  But no file link provided!`);
                            }
                        }
                    } else {
                        console.log(`      5. ❌ Next node ${buttonNode.next} not found in bot config!`);
                    }
                } else {
                    console.log(`      4. ❌ Button node has no next node!`);
                }
            } else {
                console.log(`      3. ❌ Button node ${buttonId} not found in bot config!`);
                console.log(`         Available nodes: ${Object.keys(botConfig).join(', ')}`);
            }
        }

        // Step 5: Check recent messages
        console.log(`\n📋 Step 5: Checking recent messages...`);
        console.log('='.repeat(70));

        if (conversation) {
            const recentMessages = await prisma.message.findMany({
                where: {
                    conversationId: conversation.id
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 10
            });

            console.log(`\n   Last ${recentMessages.length} messages:`);
            recentMessages.forEach((msg, idx) => {
                console.log(`   ${idx + 1}. [${msg.fromCustomer ? 'Customer' : 'Bot'}] ${msg.isBot ? '(Bot)' : ''}`);
                console.log(`      Type: ${msg.type}, FileType: ${msg.fileType}`);
                console.log(`      Message: "${(msg.message || '').substring(0, 60)}${(msg.message || '').length > 60 ? '...' : ''}"`);
                console.log(`      Time: ${new Date(msg.createdAt).toISOString()}`);
                console.log(`      Status: ${msg.status}`);
                console.log('');
            });
        }

        // Step 6: Recommendations
        console.log(`\n📋 Step 6: Recommendations & Debugging Tips`);
        console.log('='.repeat(70));

        const issues = [];

        if (!conversation) {
            issues.push('No conversation found - send the trigger message first');
        } else {
            if (conversation.chatbotId !== chatbot.id) {
                issues.push(`Conversation has different chatbot ID (${conversation.chatbotId} vs ${chatbot.id})`);
            }
            
            if (conversation.currentNode !== buttonMessageNode.nodeId) {
                issues.push(`Current node (${conversation.currentNode}) doesn't match button message node (${buttonMessageNode.nodeId})`);
                issues.push(`This means the conversation is at a different point in the flow`);
            }
            
            if (conversation.chatbotTimeout && Number(conversation.chatbotTimeout) < Date.now()) {
                issues.push(`Chatbot timeout has expired - interactive messages should still work with the fix`);
            }
        }

        if (issues.length > 0) {
            console.log(`\n   ⚠️  Potential Issues Found:`);
            issues.forEach((issue, idx) => {
                console.log(`      ${idx + 1}. ${issue}`);
            });
        } else {
            console.log(`\n   ✅ No obvious issues found in the configuration`);
        }

        console.log(`\n   📝 Testing Steps:`);
        console.log(`      1. Send "${trigger}" to ${normalizedPhone}`);
        console.log(`      2. You should receive: "Welcome, here are our offers:"`);
        console.log(`      3. Then receive a button message with buttons`);
        console.log(`      4. Click a button (e.g., "Products")`);
        console.log(`      5. You should receive a CTA button message`);
        console.log(`      6. Check server logs for any errors`);

        console.log(`\n   🔧 If CTA doesn't send, check:`);
        console.log(`      - Server logs for "handleInteractiveMsg" messages`);
        console.log(`      - Server logs for "New node found"`);
        console.log(`      - Server logs for "sendCtaButtonMsg"`);
        console.log(`      - Ensure the button node's 'next' property points to the CTA node`);
        console.log(`      - Ensure the CTA node has both buttonText and url configured`);

        console.log(`\n🎉 Debug analysis completed!\n`);
        
    } catch (error) {
        console.error('\n❌ Error in debug script:', error);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testChatbotFlowDebug();


