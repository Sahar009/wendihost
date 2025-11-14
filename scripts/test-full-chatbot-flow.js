const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFullChatbotFlow() {
    try {
        console.log('🧪 Testing Full Chatbot Flow (Button Clicks, File Uploads, CTA)\n');
        console.log('='.repeat(70));
        
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
            return;
        }

        console.log(`✅ Found chatbot: ${chatbot.name} (ID: ${chatbot.id})`);
        console.log(`   Workspace: ${chatbot.workspace.name} (ID: ${chatbot.workspace.id})`);

        // Step 2: Parse bot configuration
        if (!chatbot.bot) {
            console.log(`❌ Bot configuration is missing!`);
            return;
        }

        const botConfig = JSON.parse(chatbot.bot);
        console.log(`\n📋 Step 2: Analyzing bot configuration...`);
        console.log(`   Total nodes: ${Object.keys(botConfig).length}`);

        // Step 3: Trace the full flow
        console.log(`\n📋 Step 3: Tracing complete chatbot flow...`);
        console.log('='.repeat(70));
        
        const flowMap = new Map();
        const nodeTypes = new Set();
        let buttonMessageNode = null;
        let buttonNodes = [];
        let fileUploadNodes = [];
        let ctaNodes = [];
        
        // Build flow map
        Object.entries(botConfig).forEach(([nodeId, node]) => {
            flowMap.set(nodeId, node);
            nodeTypes.add(node.type);
            
            if (node.type === 'BUTTON_MESSAGE_NODE') {
                buttonMessageNode = node;
            }
            
            if (node.type === 'CHAT_BOT_MSG_NODE') {
                fileUploadNodes.push({ nodeId, node });
            }
            
            if (node.cta) {
                ctaNodes.push({ nodeId, node, cta: node.cta });
            }
        });

        console.log(`\n   Node Types Found: ${Array.from(nodeTypes).join(', ')}`);
        
        // Trace from start
        let currentNode = botConfig['start'];
        let path = ['start'];
        let step = 1;
        
        console.log(`\n   📍 Flow Path:`);
        console.log(`   ${step}. START_NODE → ${currentNode.next || 'END'}`);
        
        while (currentNode && currentNode.next) {
            step++;
            const nextNode = botConfig[currentNode.next];
            if (!nextNode) break;
            
            path.push(currentNode.next);
            
            const nodeInfo = {
                id: nextNode.nodeId,
                type: nextNode.type,
                message: nextNode.message?.substring(0, 60) || '(no message)',
                hasChildren: (nextNode.children?.length || 0) > 0,
                childrenCount: nextNode.children?.length || 0,
                hasCta: !!nextNode.cta,
                hasFile: nextNode.fileType && nextNode.fileType !== 'none',
                fileType: nextNode.fileType || 'none',
                hasLocation: !!nextNode.location,
                hasApi: !!nextNode.api
            };
            
            console.log(`   ${step}. ${nextNode.nodeId}`);
            console.log(`      Type: ${nodeInfo.type}`);
            console.log(`      Message: "${nodeInfo.message}"`);
            
            if (nodeInfo.type === 'BUTTON_MESSAGE_NODE') {
                console.log(`      ✅ BUTTON MESSAGE NODE`);
                console.log(`      Buttons: ${nodeInfo.childrenCount}`);
                if (nextNode.children && nextNode.children.length > 0) {
                    nextNode.children.forEach((btn, idx) => {
                        const btnText = btn.message || btn.title || 'No text';
                        console.log(`         ${idx + 1}. "${btnText}" → ${btn.nodeId || btn.id || 'N/A'}`);
                    });
                }
            }
            
            if (nodeInfo.hasCta) {
                console.log(`      ✅ CTA Button: "${nextNode.cta.buttonText}" → ${nextNode.cta.url}`);
            }
            
            if (nodeInfo.hasFile) {
                console.log(`      ✅ File Upload: ${nodeInfo.fileType} - ${nextNode.link ? 'Has link' : 'No link'}`);
            }
            
            if (nodeInfo.hasLocation) {
                console.log(`      ✅ Location: ${nextNode.location.name || 'Location'}`);
            }
            
            if (nodeInfo.hasApi) {
                console.log(`      ✅ API Call: ${nextNode.api.method} ${nextNode.api.endpoint}`);
            }
            
            currentNode = nextNode;
        }

        // Step 4: Analyze button click paths
        console.log(`\n📋 Step 4: Analyzing button click paths...`);
        console.log('='.repeat(70));
        
        if (buttonMessageNode && buttonMessageNode.children) {
            console.log(`\n   Button Message Node: ${buttonMessageNode.nodeId}`);
            console.log(`   Message: "${buttonMessageNode.message || '(empty - will use default)'}"`);
            console.log(`   Buttons: ${buttonMessageNode.children.length}\n`);
            
            buttonMessageNode.children.forEach((button, index) => {
                const buttonId = button.nodeId || button.id;
                const buttonText = button.message || button.title || 'No text';
                
                console.log(`   Button ${index + 1}: "${buttonText}"`);
                console.log(`      ID: ${buttonId}`);
                
                // Find what happens when this button is clicked
                const buttonNode = botConfig[buttonId];
                if (buttonNode) {
                    console.log(`      Next Node: ${buttonNode.next || 'END'}`);
                    console.log(`      Type: ${buttonNode.type}`);
                    console.log(`      Message: "${buttonNode.message?.substring(0, 60) || 'No message'}${buttonNode.message?.length > 60 ? '...' : ''}"`);
                    
                    // Check if this leads to file upload or CTA
                    if (buttonNode.next) {
                        const nextAfterButton = botConfig[buttonNode.next];
                        if (nextAfterButton) {
                            if (nextAfterButton.type === 'CHAT_BOT_MSG_NODE') {
                                console.log(`      ✅ Leads to FILE UPLOAD node`);
                                console.log(`         File Type: ${nextAfterButton.fileType || 'none'}`);
                                console.log(`         Link: ${nextAfterButton.link ? 'Set' : 'Not set'}`);
                            }
                            if (nextAfterButton.cta) {
                                console.log(`      ✅ Leads to CTA button`);
                                console.log(`         CTA Text: "${nextAfterButton.cta.buttonText}"`);
                                console.log(`         CTA URL: ${nextAfterButton.cta.url}`);
                            }
                        }
                    }
                } else {
                    console.log(`      ⚠️  Button node not found in bot config!`);
                }
                console.log('');
            });
        } else {
            console.log(`   ⚠️  No button message node found`);
        }

        // Step 5: Check file upload nodes
        console.log(`\n📋 Step 5: Checking file upload nodes...`);
        console.log('='.repeat(70));
        
        if (fileUploadNodes.length > 0) {
            console.log(`   Found ${fileUploadNodes.length} file upload node(s):\n`);
            fileUploadNodes.forEach(({ nodeId, node }, index) => {
                console.log(`   ${index + 1}. Node: ${nodeId}`);
                console.log(`      File Type: ${node.fileType || 'none'}`);
                console.log(`      Link: ${node.link || 'Not set'}`);
                console.log(`      Message: "${node.message?.substring(0, 60) || 'No message'}${node.message?.length > 60 ? '...' : ''}"`);
                console.log(`      Next: ${node.next || 'END'}\n`);
            });
        } else {
            console.log(`   ⚠️  No file upload nodes found in this chatbot`);
        }

        // Step 6: Check CTA nodes
        console.log(`\n📋 Step 6: Checking CTA button nodes...`);
        console.log('='.repeat(70));
        
        if (ctaNodes.length > 0) {
            console.log(`   Found ${ctaNodes.length} CTA node(s):\n`);
            ctaNodes.forEach(({ nodeId, node, cta }, index) => {
                console.log(`   ${index + 1}. Node: ${nodeId}`);
                console.log(`      Message: "${node.message?.substring(0, 60) || 'No message'}${node.message?.length > 60 ? '...' : ''}"`);
                console.log(`      CTA Button Text: "${cta.buttonText}"`);
                console.log(`      CTA URL: ${cta.url}`);
                console.log(`      CTA Style: ${cta.style || 'primary'}`);
                console.log(`      Next: ${node.next || 'END'}\n`);
            });
        } else {
            console.log(`   ⚠️  No CTA button nodes found in this chatbot`);
        }

        // Step 7: Test simulation
        console.log(`\n📋 Step 7: Simulating user interactions...`);
        console.log('='.repeat(70));
        
        console.log(`\n   Scenario 1: User sends trigger "${trigger}"`);
        console.log(`   Expected:`);
        console.log(`     1. Text: "Welcome, here are our offers:"`);
        if (buttonMessageNode) {
            console.log(`     2. Button Message: "${buttonMessageNode.message || 'Please select an option:'}"`);
            console.log(`     3. Buttons: ${buttonMessageNode.children.length} interactive buttons`);
            buttonMessageNode.children.forEach((btn, idx) => {
                console.log(`        - "${btn.message || btn.title}"`);
            });
        }
        
        if (buttonMessageNode && buttonMessageNode.children && buttonMessageNode.children.length > 0) {
            console.log(`\n   Scenario 2: User clicks first button "${buttonMessageNode.children[0].message || buttonMessageNode.children[0].title}"`);
            const firstButton = buttonMessageNode.children[0];
            const buttonNode = botConfig[firstButton.nodeId || firstButton.id];
            
            if (buttonNode) {
                console.log(`   Expected:`);
                console.log(`     1. Button response processed`);
                if (buttonNode.next) {
                    const nextNode = botConfig[buttonNode.next];
                    if (nextNode) {
                        console.log(`     2. Next node: ${nextNode.nodeId} (${nextNode.type})`);
                        console.log(`        Message: "${nextNode.message?.substring(0, 60) || 'No message'}${nextNode.message?.length > 60 ? '...' : ''}"`);
                        
                        if (nextNode.type === 'CHAT_BOT_MSG_NODE') {
                            console.log(`     3. ✅ FILE UPLOAD should be sent`);
                            console.log(`        File Type: ${nextNode.fileType || 'none'}`);
                            console.log(`        Link: ${nextNode.link ? 'Set ✅' : 'Not set ❌'}`);
                        }
                        
                        if (nextNode.cta) {
                            console.log(`     3. ✅ CTA BUTTON should be sent`);
                            console.log(`        Button: "${nextNode.cta.buttonText}"`);
                            console.log(`        URL: ${nextNode.cta.url}`);
                        }
                    }
                }
            }
        }

        // Step 8: Validation summary
        console.log(`\n📋 Step 8: Validation Summary`);
        console.log('='.repeat(70));
        
        const validations = {
            'Chatbot found and published': !!chatbot && chatbot.publish,
            'Bot configuration exists': !!chatbot.bot,
            'Start node exists': !!botConfig['start'],
            'Button message node found': !!buttonMessageNode,
            'Buttons configured': buttonMessageNode?.children?.length > 0 || false,
            'File upload nodes found': fileUploadNodes.length > 0,
            'CTA nodes found': ctaNodes.length > 0,
            'Workspace connected': !!(chatbot.workspace.phone && chatbot.workspace.accessToken)
        };

        Object.entries(validations).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });

        // Step 9: Recommendations
        console.log(`\n📋 Step 9: Recommendations`);
        console.log('='.repeat(70));
        
        if (!buttonMessageNode) {
            console.log(`\n   ⚠️  No Button Message Node found`);
            console.log(`      Add a Button Message node to your chatbot flow`);
        } else if (!buttonMessageNode.children || buttonMessageNode.children.length === 0) {
            console.log(`\n   ⚠️  Button Message Node has no buttons`);
            console.log(`      Add buttons to the Button Message node`);
        } else {
            console.log(`\n   ✅ Button Message Node is configured correctly`);
        }
        
        if (fileUploadNodes.length === 0) {
            console.log(`\n   ℹ️  No file upload nodes found`);
            console.log(`      This is okay if you don't need file uploads`);
        } else {
            fileUploadNodes.forEach(({ nodeId, node }) => {
                if (!node.link) {
                    console.log(`\n   ⚠️  File Upload Node ${nodeId} has no file link`);
                    console.log(`      Upload a file in the chatbot builder`);
                }
            });
        }
        
        if (ctaNodes.length === 0) {
            console.log(`\n   ℹ️  No CTA button nodes found`);
            console.log(`      This is okay if you don't need CTA buttons`);
        } else {
            ctaNodes.forEach(({ nodeId, cta }) => {
                if (!cta.url || !cta.buttonText) {
                    console.log(`\n   ⚠️  CTA Node ${nodeId} is missing URL or button text`);
                }
            });
        }

        console.log(`\n🎉 Full flow test completed!\n`);
        
    } catch (error) {
        console.error('\n❌ Error testing full flow:', error);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testFullChatbotFlow();

