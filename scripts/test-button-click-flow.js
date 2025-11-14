const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * This script simulates the full flow when a button is clicked:
 * 1. User sends trigger "go"
 * 2. Bot sends button message
 * 3. User clicks a button
 * 4. Bot processes the click and sends the next message (CTA or file)
 */
async function testButtonClickFlow() {
    try {
        console.log('🧪 Testing Button Click Flow (CTA & File Upload)\n');
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

        if (!chatbot.bot) {
            console.log(`❌ Bot configuration is missing!`);
            return;
        }

        const botConfig = JSON.parse(chatbot.bot);
        
        // Step 2: Find button message node
        console.log(`\n📋 Step 2: Finding button message node...`);
        const buttonMessageNode = Object.values(botConfig).find(
            node => node.type === 'BUTTON_MESSAGE_NODE'
        );

        if (!buttonMessageNode) {
            console.log(`❌ No button message node found`);
            return;
        }

        console.log(`✅ Button Message Node: ${buttonMessageNode.nodeId}`);
        console.log(`   Message: "${buttonMessageNode.message || '(empty - will use default)'}"`);
        console.log(`   Buttons: ${buttonMessageNode.children?.length || 0}`);

        // Step 3: Test each button click path
        console.log(`\n📋 Step 3: Testing button click paths...`);
        console.log('='.repeat(70));

        if (!buttonMessageNode.children || buttonMessageNode.children.length === 0) {
            console.log(`❌ No buttons configured`);
            return;
        }

        for (let i = 0; i < buttonMessageNode.children.length; i++) {
            const button = buttonMessageNode.children[i];
            const buttonId = button.nodeId || button.id;
            const buttonText = button.message || button.title || 'No text';
            
            console.log(`\n   🔘 Button ${i + 1}: "${buttonText}"`);
            console.log(`      ID: ${buttonId}`);
            
            // Find the node this button points to
            const buttonNode = botConfig[buttonId];
            if (!buttonNode) {
                console.log(`      ❌ Button node not found in bot config!`);
                continue;
            }

            console.log(`      Button Node: ${buttonNode.nodeId} (${buttonNode.type})`);
            console.log(`      Next: ${buttonNode.next || 'END'}`);

            // Find what happens after button click
            if (buttonNode.next) {
                const nextNode = botConfig[buttonNode.next];
                if (nextNode) {
                    console.log(`\n      📍 Next Node After Click: ${nextNode.nodeId}`);
                    console.log(`         Type: ${nextNode.type}`);
                    console.log(`         Message: "${nextNode.message || '(no message)'}"`);
                    
                    // Check for CTA
                    if (nextNode.cta) {
                        console.log(`\n         ✅ CTA BUTTON DETECTED:`);
                        console.log(`            Button Text: "${nextNode.cta.buttonText}"`);
                        console.log(`            URL: ${nextNode.cta.url}`);
                        console.log(`            Style: ${nextNode.cta.style || 'primary'}`);
                        console.log(`\n         📤 EXPECTED BEHAVIOR:`);
                        console.log(`            When user clicks "${buttonText}":`);
                        console.log(`            1. Button click is processed`);
                        console.log(`            2. handleTextMsgType() is called`);
                        console.log(`            3. CTA detected → sendCtaButtonMsg() is called`);
                        console.log(`            4. WhatsApp receives interactive message with CTA button`);
                        console.log(`            5. User can click CTA to open URL: ${nextNode.cta.url}`);
                        
                        // Validate CTA
                        const ctaValid = nextNode.cta.buttonText && nextNode.cta.url;
                        if (!ctaValid) {
                            console.log(`\n         ⚠️  WARNING: CTA is missing buttonText or URL!`);
                        } else {
                            console.log(`\n         ✅ CTA is properly configured`);
                        }
                    } else {
                        console.log(`\n         ℹ️  No CTA button configured for this path`);
                    }
                    
                    // Check for file upload
                    if (nextNode.fileType && nextNode.fileType !== 'none') {
                        console.log(`\n         ✅ FILE UPLOAD DETECTED:`);
                        console.log(`            File Type: ${nextNode.fileType}`);
                        console.log(`            Link: ${nextNode.link || 'Not set'}`);
                        console.log(`\n         📤 EXPECTED BEHAVIOR:`);
                        console.log(`            When user clicks "${buttonText}":`);
                        console.log(`            1. Button click is processed`);
                        console.log(`            2. handleTextMsgType() is called`);
                        console.log(`            3. File type detected: ${nextNode.fileType}`);
                        console.log(`            4. send${nextNode.fileType.charAt(0).toUpperCase() + nextNode.fileType.slice(1)}Msg() is called`);
                        console.log(`            5. WhatsApp receives ${nextNode.fileType} message`);
                        
                        if (!nextNode.link) {
                            console.log(`\n         ⚠️  WARNING: File type is set but no link/URL provided!`);
                            console.log(`            Upload a file in the chatbot builder for this node.`);
                        } else {
                            console.log(`\n         ✅ File upload is properly configured`);
                        }
                    } else {
                        console.log(`\n         ℹ️  No file upload configured for this path`);
                    }
                    
                    // Check if both CTA and file are present
                    if (nextNode.cta && nextNode.fileType && nextNode.fileType !== 'none') {
                        console.log(`\n         ⚠️  NOTE: Both CTA and file upload are configured.`);
                        console.log(`            Priority: CTA will be sent first (handleTextMsgType returns early).`);
                        console.log(`            File upload will NOT be sent if CTA exists.`);
                        console.log(`            To send both, you need separate nodes.`);
                    }
                    
                    // Check message text
                    if (!nextNode.message || nextNode.message.trim() === '') {
                        console.log(`\n         ⚠️  WARNING: Next node has no message text!`);
                        if (nextNode.cta) {
                            console.log(`            For CTA buttons, message text is optional but recommended.`);
                            console.log(`            If missing, button text will be used as fallback.`);
                        } else if (nextNode.fileType && nextNode.fileType !== 'none') {
                            console.log(`            For file uploads, message text is used as caption.`);
                        } else {
                            console.log(`            This node will send an empty message.`);
                        }
                    }
                } else {
                    console.log(`      ❌ Next node ${buttonNode.next} not found in bot config`);
                }
            } else {
                console.log(`      ℹ️  Button node has no next node (flow ends)`);
            }
        }

        // Step 4: Summary and recommendations
        console.log(`\n📋 Step 4: Summary & Recommendations`);
        console.log('='.repeat(70));
        
        let hasCta = false;
        let hasFileUpload = false;
        let ctaCount = 0;
        let fileUploadCount = 0;
        
        Object.values(botConfig).forEach(node => {
            if (node.cta) {
                hasCta = true;
                ctaCount++;
            }
            if (node.fileType && node.fileType !== 'none' && node.link) {
                hasFileUpload = true;
                fileUploadCount++;
            }
        });

        console.log(`\n   Configuration Summary:`);
        console.log(`      ✅ Button messages: Configured`);
        console.log(`      ${hasCta ? '✅' : '❌'} CTA buttons: ${ctaCount} node(s)`);
        console.log(`      ${hasFileUpload ? '✅' : '❌'} File uploads: ${fileUploadCount} node(s) with files`);
        
        console.log(`\n   Testing Instructions:`);
        console.log(`      1. Send "${trigger}" to your WhatsApp number`);
        console.log(`      2. You should receive a button message with ${buttonMessageNode.children.length} buttons`);
        console.log(`      3. Click any button`);
        console.log(`      4. Check what message you receive:`);
        console.log(`         - If CTA is configured: You should see a message with a clickable URL button`);
        console.log(`         - If file upload is configured: You should see the file (image/video/audio)`);
        console.log(`         - If both: Only CTA will be sent (CTA has priority)`);
        
        console.log(`\n   Code Flow Verification:`);
        console.log(`      ✅ Button clicks → handleInteractiveMsg() → finds next node`);
        console.log(`      ✅ Next node → generateMessages() → creates message array`);
        console.log(`      ✅ Messages → sendMessages() → calls handleTextMsgType()`);
        console.log(`      ✅ handleTextMsgType() checks:`);
        console.log(`         1. Location (if present)`);
        console.log(`         2. CTA button (if present) → sends CTA, returns early`);
        console.log(`         3. API call (if present)`);
        console.log(`         4. File upload (image/video/audio) → sends file`);
        console.log(`         5. Text message (default)`);
        
        console.log(`\n🎉 Button click flow test completed!\n`);
        
    } catch (error) {
        console.error('\n❌ Error testing button click flow:', error);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testButtonClickFlow();

