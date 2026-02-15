/**
 * icaffeOS SMS Gateway Server
 * WhatsApp Web Style SMS Dashboard Backend
 *
 * Interfaces with SIM7670G 4G Modem via Serial Port
 */

import 'dotenv/config'; // Make sure env vars are loaded 
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { createServer } from 'http';
import axios from 'axios';

const app = express();
const PORT = 8085;

// Configuration
const MAYA_API_URL = 'http://localhost:8081/api/maya/chat';
const DEFAULT_BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

// Cloud Provider Config (Placeholders)
const CLOUD_API_URL = 'https://api.sms-provider.com/v1/send';
const CLOUD_API_KEY = 'SK_REPLACE_WITH_ACTUAL_KEY';

// Global connectivity state
let isLocalUp = true;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Create HTTP server for WebSocket
const server = createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });

// Store connected WebSocket clients
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('📱 New WebSocket client connected');
    clients.add(ws);

    // Send connection confirmation
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now(), isLocalUp }));

    ws.on('close', () => {
        console.log('📱 WebSocket client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        clients.delete(ws);
    });
});

// Broadcast to all connected clients
function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// ============================================
// Serial Port / Modem Configuration
// ============================================

const MODEM_PATH = process.env.MODEM_PATH || '/dev/cu.usbmodem0000000000017';
const BAUD_RATE = 115200;

let serialPort = null;
let parser = null;
let isModemReady = false;
let signalStrength = 0;
let pendingResponse = null;
let responseBuffer = [];

// Message queue for sending
const messageQueue = [];
let isSending = false;

// Initialize Serial Port
async function initModem() {
    try {
        console.log(`🔌 Connecting to modem at ${MODEM_PATH}...`);

        serialPort = new SerialPort({
            path: MODEM_PATH,
            baudRate: BAUD_RATE,
            autoOpen: false
        });

        parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        // Handle incoming data
        parser.on('data', handleModemResponse);

        // Handle errors
        serialPort.on('error', (err) => {
            console.error('❌ Serial Port Error:', err.message);
            isModemReady = false;
            isLocalUp = false;
            broadcast({ type: 'modem_status', status: 'error', error: err.message, isLocalUp });
        });

        // Open port
        await new Promise((resolve, reject) => {
            serialPort.open((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('✅ Serial port opened');

        // Initialize modem with AT commands
        await initializeModemSettings();

    } catch (error) {
        console.error('❌ Failed to initialize modem:', error.message);
        // Continue without modem for development
        isModemReady = false;
        isLocalUp = false;
        broadcast({ type: 'modem_status', status: 'disconnected', error: error.message, isLocalUp });
    }
}

// Initialize modem settings
async function initializeModemSettings() {
    console.log('⏳ Waiting 3 seconds for port to stabilize...');
    await new Promise(r => setTimeout(r, 3000));

    try {
        // Test modem
        await sendATCommand('AT', 2000).catch(e => console.warn('AT failed'));

        // Check PIN status
        await sendATCommand('AT+CPIN?', 2000).catch(e => console.warn('CPIN failed'));

        // Network Re-registration (Force fresh attach)
        console.log('🔄 Triggering Network Re-registration (COPS)...');
        await sendATCommand('AT+COPS=2', 10000).catch(e => { }); // Deregister
        await new Promise(r => setTimeout(r, 5000));
        await sendATCommand('AT+COPS=0', 20000).catch(e => console.warn('COPS=0 failed')); // Register 

        // Wait for registration
        for (let i = 0; i < 10; i++) {
            const creg = await sendATCommand('AT+CREG?', 2000).catch(e => '');
            if (creg.includes(',1') || creg.includes(',5') || creg.includes(',6')) {
                console.log('📶 Network registered');
                break;
            }
            await new Promise(r => setTimeout(r, 3000));
        }

        // PARTNER SPECIFIC: Set correct SMSC !!!
        console.log('📱 Setting Partner SMSC (+97254120032)...');
        await sendATCommand('AT+CSCA="+97254120032",145', 2000).catch(e => console.warn('CSCA failed'));

        // Verify SMSC
        const csca = await sendATCommand('AT+CSCA?', 2000).catch(e => 'unknown');
        console.log(`📱 Verified SMSC: ${csca}`);

        // Force network mode to Automatic (LTE/GSM)
        await sendATCommand('AT+CNMP=2', 2000).catch(e => { });

        // IMPORTANT: Set character set to GSM for commands
        await sendATCommand('AT+CSCS="GSM"', 2000).catch(e => console.warn('CSCS=GSM failed'));

        // Set text mode for SMS
        await sendATCommand('AT+CMGF=1', 2000).catch(e => console.warn('CMGF=1 failed'));

        // Select Memory Storage - Try ME (Mobile Equipment)
        try {
            await sendATCommand('AT+CPMS="ME","ME","ME"', 2000);
        } catch (e) {
            console.warn('⚠️ CPMS="ME" failed, trying "SM"...');
            await sendATCommand('AT+CPMS="SM","SM","SM"', 2000).catch(e => { });
        }

        // Finalize state
        isModemReady = true;
        isLocalUp = true;
        console.log('✅ Modem initialized (Pelephone Optimized)');
        broadcast({ type: 'modem_status', status: 'ready', signal: 0, isLocalUp });

    } catch (error) {
        console.error('❌ Critical failure in Modem initialization:', error.message);
        isModemReady = false;
        isLocalUp = false;
        broadcast({ type: 'modem_status', status: 'error', error: error.message, isLocalUp });
    }
}

// Health Check Interval (runs every 30 seconds)
setInterval(async () => {
    try {
        if (!isModemReady || !serialPort || !serialPort.isOpen) {
            if (isLocalUp) {
                isLocalUp = false;
                console.warn('⚠️ Modem disconnected - isLocalUp set to false');
                broadcast({ type: 'health_update', isLocalUp, signal: 0 });
            }
            return;
        }

        const response = await sendATCommand('AT+CSQ', 2000);
        const match = response.match(/\+CSQ:\s*(\d+)/);

        if (!match || match[1] === '99') {
            if (isLocalUp) {
                isLocalUp = false;
                console.warn('⚠️ No signal reported by modem - isLocalUp set to false');
            }
            signalStrength = 0;
        } else {
            const rssi = parseInt(match[1]);
            signalStrength = Math.round((rssi / 31) * 100);
            if (!isLocalUp && signalStrength > 0) {
                isLocalUp = true;
                console.log('📶 Signal restored - isLocalUp set to true');
            }
        }

        broadcast({ type: 'health_update', isLocalUp, signal: signalStrength });
    } catch (err) {
        if (isLocalUp) {
            isLocalUp = false;
            console.error('❌ Health check failed (AT+CSQ timeout or error):', err.message);
            broadcast({ type: 'health_update', isLocalUp, signal: 0 });
        }
    }
}, 30000);

// Send AT command and wait for response
function sendATCommand(command, timeout = 5000) {
    return new Promise((resolve, reject) => {
        if (!serialPort || !serialPort.isOpen) {
            reject(new Error('Serial port not open'));
            return;
        }

        responseBuffer = [];

        const timer = setTimeout(() => {
            pendingResponse = null;
            reject(new Error('Command timeout'));
        }, timeout);

        pendingResponse = {
            resolve: (data) => {
                clearTimeout(timer);
                pendingResponse = null;
                resolve(data);
            },
            reject: (err) => {
                clearTimeout(timer);
                pendingResponse = null;
                reject(err);
            }
        };

        console.log(`📤 AT Command: ${command}`);
        serialPort.write(command + '\r\n');
    });
}

// Handle modem responses
function handleModemResponse(data) {
    const line = data.trim();
    if (!line) return;

    console.log(`📥 Modem: ${line}`);

    // Check for new SMS notification
    if (line.startsWith('+CMTI:')) {
        handleNewSMSNotification(line);
        return;
    }

    // Check for incoming SMS content
    if (line.startsWith('+CMGR:')) {
        handleIncomingSMS(line);
        return;
    }

    // Check for signal strength response
    if (line.startsWith('+CSQ:')) {
        parseSignalStrength(line);
    }

    // Collect response
    responseBuffer.push(line);

    // Check for command completion
    if (line === 'OK' || line === 'ERROR' || line.startsWith('+CME ERROR') || line.startsWith('+CMS ERROR')) {
        if (pendingResponse) {
            if (line === 'OK') {
                pendingResponse.resolve(responseBuffer.join('\n'));
            } else {
                pendingResponse.reject(new Error(line));
            }
        }
    }

    // Check for SMS send success
    if (line.startsWith('+CMGS:')) {
        console.log('✅ SMS sent successfully (Modem)');
    }
}

// Parse signal strength from +CSQ response
function parseSignalStrength(response) {
    const match = response.match(/\+CSQ:\s*(\d+)/);
    if (match) {
        const rssi = parseInt(match[1]);
        // Convert to percentage (0-31 scale, 99 = unknown)
        if (rssi === 99) {
            signalStrength = 0;
            isLocalUp = false;
        } else {
            signalStrength = Math.round((rssi / 31) * 100);
            isLocalUp = true;
        }
        console.log(`📶 Signal strength: ${signalStrength}% (LocalUp: ${isLocalUp})`);
        broadcast({ type: 'signal_update', signal: signalStrength, isLocalUp });
    }
}

// 🤖 Process Maya Auto-Reply
async function processAutoReply(phone, userMessage) {
    if (!userMessage || userMessage.trim() === '') return;

    console.log(`🤖 Processing Maya reply for: "${userMessage}"`);

    try {
        // 1. Ask Maya (via local backend API)
        const response = await axios.post(MAYA_API_URL, {
            messages: [{ role: 'user', content: userMessage }],
            businessId: DEFAULT_BUSINESS_ID,
            provider: 'local' // Force local Ollama
        }, { timeout: 30000 }); // 30s timeout for AI

        const aiAnswer = response.data.response;

        if (!aiAnswer) {
            console.warn('⚠️ Maya returned empty response.');
            return;
        }

        console.log(`🤖 Maya says: "${aiAnswer}"`);

        // 2. Send SMS Reply
        // Add a small delay for "thinking" feel + processing stability
        setTimeout(async () => {
            try {
                // Determine if critical? No, regular chat is rarely critical.
                // But we use the robust sendSms function anyway.
                // However, infinite loop risk check:
                if (aiAnswer === userMessage) {
                    console.warn('⚠️ Loop detected? AI replied with same message.');
                    return;
                }

                await sendSms({
                    phone: phone,
                    message: aiAnswer,
                    isCritical: false // AI chat is not critical
                });
            } catch (sendErr) {
                console.error(`❌ Failed to send Maya reply: ${sendErr.message}`);
            }
        }, 2000);

    } catch (apiError) {
        console.error(`❌ Maya API Error: ${apiError.message}`);
        if (apiError.code === 'ECONNREFUSED') {
            console.error('⚠️ Is backend_server.js running on port 8081?');
        }
    }
}

// Handle new SMS notification (+CMTI)
async function handleNewSMSNotification(data) {
    // Format: +CMTI: "SM",<index>
    const match = data.match(/\+CMTI:\s*"(\w+)",(\d+)/);
    if (match) {
        const storage = match[1];
        const index = match[2];
        console.log(`📬 New SMS in ${storage} at index ${index}`);

        // Read the message
        try {
            await sendATCommand(`AT+CMGR=${index}`, 3000);
        } catch (error) {
            console.error('Error reading SMS:', error);
        }
    }
}


// Handle incoming SMS content (+CMGR)
function handleIncomingSMS(data) {
    // Parse the SMS data
    // Format varies but typically: +CMGR: "REC UNREAD","+972...",,"timestamp"
    const parts = data.split(',');

    // This is simplified - real implementation would need full parsing
    const sms = {
        id: Date.now().toString(),
        type: 'incoming',
        status: parts[0]?.includes('UNREAD') ? 'unread' : 'read',
        from: parts[1]?.replace(/"/g, ''),
        timestamp: new Date().toISOString(),
        content: '' // Content comes in next line
    };

    // Listen for the actual message content
    const contentHandler = async (content) => {
        if (content && content !== 'OK' && !content.includes('+CMGR:')) {
            sms.content = decodeUCS2(content.trim());

            console.log(`📨 Received SMS from ${sms.from}: ${sms.content}`);

            // Broadcast to all clients
            broadcast({
                type: 'new_sms',
                message: sms
            });

            // 🤖 Trigger Maya Auto-Reply
            try {
                await processAutoReply(sms.from, sms.content);
            } catch (err) {
                console.error('❌ Auto-reply failed:', err.message);
            }
        }
        parser.off('data', contentHandler);
    };

    parser.once('data', contentHandler);
}

// Encode text to UCS2 for Hebrew support
function encodeUCS2(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const hex = text.charCodeAt(i).toString(16).padStart(4, '0');
        result += hex.toUpperCase();
    }
    return result;
}

// Decode UCS2 to text
function decodeUCS2(hex) {
    let result = '';
    for (let i = 0; i < hex.length; i += 4) {
        const code = parseInt(hex.substr(i, 4), 16);
        result += String.fromCharCode(code);
    }
    return result;
}

/**
 * sendSmsViaModemHttp - Send SMS via Modem's internal HTTP stack (AT Commands)
 * Used when system network is down but modem has data connectivity.
 */
async function sendSmsViaModemHttp(phone, message) {
    if (!isModemReady) throw new Error("Modem not ready for HTTP");

    console.log(`📡 Attempting to send SMS via Modem Internal HTTP to ${phone}...`);

    // Helper to send AT and wait
    const execAT = async (cmd, pattern = 'OK', timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                parser.off('data', onData);
                reject(new Error(`Timeout ${cmd}`));
            }, timeout);

            function onData(line) {
                if (line.includes(pattern) || line.includes('ERROR') || line.includes('+HTTPACTION:')) {
                    if (line.includes('+HTTPACTION:') || line.includes('DOWNLOAD')) {
                        clearTimeout(timer); parser.off('data', onData); resolve(line);
                    } else if (line.includes('ERROR') || line.includes(pattern)) {
                        clearTimeout(timer); parser.off('data', onData); resolve(line);
                    }
                }
            }
            console.log(`📤 ${cmd}`);
            serialPort.write(`${cmd}\r`);
            parser.on('data', onData);
        });
    };

    try {
        await execAT('AT+HTTPTERM', 'OK'); // Clean start
        await execAT('AT+HTTPINIT', 'OK');
        await execAT(`AT+HTTPPARA="URL","${CLOUD_API_URL}"`, 'OK');
        await execAT('AT+HTTPPARA="CONTENT","application/json"', 'OK');

        const payload = JSON.stringify({ phone, message, apiKey: CLOUD_API_KEY });
        const len = payload.length;

        const dataRes = await execAT(`AT+HTTPDATA=${len},5000`, 'DOWNLOAD');
        if (!dataRes.includes('DOWNLOAD')) throw new Error("HTTPDATA failed");

        serialPort.write(payload);
        await new Promise(r => setTimeout(r, 1000)); // Wait for data write

        const actionRes = await execAT('AT+HTTPACTION=1', '+HTTPACTION:', 60000); // 1 = POST
        console.log(`HTTP Action Result: ${actionRes}`);

        // Parse status: +HTTPACTION: 1,200,len
        if (!actionRes.includes(',200,')) {
            throw new Error(`HTTP POST Failed: ${actionRes}`);
        }

        const readRes = await execAT('AT+HTTPREAD', 'OK');
        console.log(`HTTP Response: ${readRes}`);

        await execAT('AT+HTTPTERM', 'OK');
        return { success: true, provider: 'modem-http', data: readRes };

    } catch (e) {
        await execAT('AT+HTTPTERM', 'OK').catch(() => { }); // Cleanup
        console.error(`❌ Modem Internal HTTP Failed: ${e.message}`);
        throw e;
    }
}

/**
 * sendSmsCloud - Fallback provider using HTTP API with Backoff and Modem Fallback
 */
async function sendSmsCloud(phone, message, retries = 2) {
    let delay = 1000;

    // 1. Try Standard Internet (Axios)
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🌐 Sending SMS via Cloud Provider to ${phone} (Attempt ${attempt}/${retries})...`);
            const response = await axios.post(CLOUD_API_URL, {
                phone: phone,
                message: message,
                apiKey: CLOUD_API_KEY
            }, { timeout: 8000 });

            console.log('✅ SMS sent successfully (Cloud/Axios)');
            return {
                success: true,
                provider: 'cloud-axios',
                data: response.data
            };
        } catch (error) {
            console.error(`❌ Cloud SMS attempt ${attempt} failed:`, error.message);
            if (attempt < retries) {
                console.log(`⏳ Backing off for ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    }

    // 2. Fallback to Modem Internal HTTP
    console.warn('⚠️ Standard Internet failed. Using Modem Internal Data Connection...');
    try {
        return await sendSmsViaModemHttp(phone, message);
    } catch (modemError) {
        throw new Error(`All Cloud Failover methods failed. Axios: Network Error. Modem HTTP: ${modemError.message}`);
    }
}

/**
 * Unified sendSms function with Fallback/Failover logic
 * @param {Object} payload { phone, message, isCritical }
 */
async function sendSms(payload) {
    const { phone, message, isCritical } = payload;

    // Step 1: Attempt Local Modem if UP
    if (isLocalUp) {
        try {
            // Use existing queue logic for local sends
            const result = await new Promise((resolve, reject) => {
                messageQueue.push({ phone, message, resolve, reject });
                processMessageQueue();
            });

            return {
                success: true,
                route: 'local',
                message: result
            };
        } catch (error) {
            console.error(`❌ Local send failed: ${error.message}`);
            // If local fails and it's critical, we continue to fallback
        }
    } else {
        console.warn(`⚠️ Local modem is DOWN (isLocalUp=false).`);
    }

    // Step 2: Fallback to Cloud if Critical
    if (isCritical) {
        try {
            const cloudResult = await sendSmsCloud(phone, message);
            return {
                success: true,
                route: 'cloud',
                message: cloudResult
            };
        } catch (cloudError) {
            return {
                success: false,
                route: 'failed',
                error: `Failover failed: ${cloudError.message}`
            };
        }
    }

    return {
        success: false,
        route: 'none',
        error: isLocalUp ? 'Local send failed but message not critical' : 'Local modem down and message not critical'
    };
}

// Send SMS via Modem (Internal low-level)
async function sendSMSInternal(phone, message) {
    return new Promise(async (resolve, reject) => {
        if (!isModemReady) {
            reject(new Error('Modem not ready'));
            return;
        }

        try {
            // Detection and Encoding
            const isHebrew = /[\u0590-\u05FF]/.test(message);
            console.log(`📨 Request to send SMS to ${phone} (Hebrew: ${isHebrew})`);

            // Try different number formats
            const cleanPhone = phone.replace(/\D/g, '');
            const phoneFormats = [];

            if (cleanPhone.startsWith('0')) {
                phoneFormats.push('+972' + cleanPhone.substring(1)); // +9725...
                phoneFormats.push('972' + cleanPhone.substring(1));  // 9725...
                phoneFormats.push(cleanPhone);                       // 05...
            } else if (cleanPhone.startsWith('972')) {
                phoneFormats.push('+' + cleanPhone);                 // +9725...
                phoneFormats.push(cleanPhone);                       // 9725...
                phoneFormats.push('0' + cleanPhone.substring(3));    // 05...
            } else {
                phoneFormats.push('+' + cleanPhone);
                phoneFormats.push(cleanPhone);
            }

            let lastError = null;
            for (const targetPhone of phoneFormats) {
                try {
                    console.log(`📤 Attempting send to: ${targetPhone}`);

                    // Set text mode and encoding for each attempt
                    await sendATCommand('AT+CMGF=1', 1000);
                    await sendATCommand('AT+CSCS="GSM"', 1000); // Always GSM for command/params

                    if (isHebrew) {
                        const encodedMessage = encodeUCS2(message);
                        // Hebrew: VPF=None (1), PID=0, DCS=8 (UCS2)
                        await sendATCommand('AT+CSMP=1,167,0,8', 1000).catch(e => { });
                        serialPort.write(`AT+CMGS="${targetPhone}"\r`);
                        await new Promise(r => setTimeout(r, 2000));
                        serialPort.write(encodedMessage);
                    } else {
                        // English: VPF=None (1), PID=0, DCS=0 (7bit)
                        await sendATCommand('AT+CSMP=1,167,0,0', 1000).catch(e => { });
                        serialPort.write(`AT+CMGS="${targetPhone}"\r`);
                        await new Promise(r => setTimeout(r, 2000));
                        serialPort.write(message);
                    }

                    await new Promise(r => setTimeout(r, 2000));
                    serialPort.write(Buffer.from([0x1A]));

                    // Wait for result of THIS attempt
                    const result = await new Promise((res, rej) => {
                        const timeout = setTimeout(() => {
                            parser.off('data', onData);
                            rej(new Error('Attempt timeout'));
                        }, 15000);

                        function onData(line) {
                            if (line.includes('+CMGS:')) {
                                clearTimeout(timeout);
                                parser.off('data', onData);
                                res(line);
                            } else if (line.includes('ERROR')) {
                                clearTimeout(timeout);
                                parser.off('data', onData);
                                rej(new Error(line));
                            }
                        }
                        parser.on('data', onData);
                    });

                    // If we reach here, it's a success
                    const smsRecord = {
                        id: Date.now().toString(),
                        type: 'outgoing',
                        to: targetPhone,
                        content: message,
                        timestamp: new Date().toISOString(),
                        status: 'sent'
                    };
                    broadcast({ type: 'sms_sent', message: smsRecord });
                    resolve(smsRecord);
                    return; // EXIT FUNCTION ON SUCCESS

                } catch (err) {
                    console.warn(`⚠️ Attempt with ${targetPhone} failed: ${err.message}`);
                    lastError = err;
                    // Try to get extended error info
                    await sendATCommand('AT+CEER', 1000).then(ceer => {
                        console.log(`🔍 Extended Error Info: ${ceer}`);
                    }).catch(e => { });

                    await new Promise(r => setTimeout(r, 2000)); // Cool down
                }
            }

            reject(lastError || new Error('All formats failed'));

        } catch (error) {
            reject(error);
        }
    });
}

// Process message queue
async function processMessageQueue() {
    if (isSending || messageQueue.length === 0) return;

    isSending = true;
    const { phone, message, resolve, reject } = messageQueue.shift();

    try {
        const result = await sendSMSInternal(phone, message);
        resolve(result);
    } catch (error) {
        reject(error);
    }

    isSending = false;

    // Process next message
    if (messageQueue.length > 0) {
        setTimeout(processMessageQueue, 1000);
    }
}

// ============================================
// API Endpoints
// ============================================

// Get modem status
app.get('/api/sms/status', (req, res) => {
    res.json({
        ready: isModemReady,
        signal: signalStrength,
        port: MODEM_PATH,
        isLocalUp: isLocalUp
    });
});

// Unified Send SMS Endpoint with Fallback support
app.post('/api/sms/send', async (req, res) => {
    const { phone, message, isCritical } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
    }

    try {
        console.log(`📨 Request to send ${isCritical ? 'CRITICAL ' : ''}SMS to ${phone}`);
        const result = await sendSms({ phone, message, isCritical: !!isCritical });

        console.log(`📤 Send result [Route: ${result.route}]:`, result.success ? 'SUCCESS' : 'FAILURE');

        // If critical message failed both local and cloud fallback, return 503 SERVICE UNAVAILABLE
        if (!result.success && isCritical) {
            return res.status(503).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('SMS send error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check signal strength
app.get('/api/sms/signal', async (req, res) => {
    try {
        if (isModemReady) {
            await sendATCommand('AT+CSQ', 2000);
        }
        res.json({ signal: signalStrength, isLocalUp });
    } catch (error) {
        res.json({ signal: signalStrength, isLocalUp, error: error.message });
    }
});

// Read all messages from SIM
app.get('/api/sms/messages', async (req, res) => {
    try {
        if (!isModemReady) {
            return res.json({ messages: [], error: 'Modem not ready' });
        }

        // List all messages
        const response = await sendATCommand('AT+CMGL="ALL"', 10000);

        // Parse messages (simplified)
        const messages = [];
        const lines = response.split('\n');

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('+CMGL:')) {
                const parts = lines[i].split(',');
                const content = lines[i + 1] || '';

                messages.push({
                    id: parts[0].replace('+CMGL:', '').trim(),
                    status: parts[1],
                    phone: parts[2]?.replace(/"/g, ''),
                    timestamp: parts[4]?.replace(/"/g, ''),
                    content: content.trim()
                });
            }
        }

        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete message
app.delete('/api/sms/messages/:index', async (req, res) => {
    try {
        if (!isModemReady) {
            return res.status(503).json({ error: 'Modem not ready' });
        }

        await sendATCommand(`AT+CMGD=${req.params.index}`, 3000);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simulate incoming SMS (For testing without SIM)
app.post('/api/sms/test-incoming', async (req, res) => {
    const { from, content } = req.body;
    if (!from || !content) {
        return res.status(400).json({ error: 'Missing from or content' });
    }

    console.log(`🧪 SIMULATING incoming SMS from ${from}: ${content}`);

    const sms = {
        id: 'test-' + Date.now(),
        type: 'incoming',
        status: 'unread',
        from: from,
        timestamp: new Date().toISOString(),
        content: content
    };

    // Broadcast to UI
    broadcast({
        type: 'new_sms',
        message: sms
    });

    // Handle auto-reply
    try {
        await processAutoReply(from, content);
        res.json({ success: true, status: 'Simulation triggered', target: from, content: content });
    } catch (err) {
        res.status(500).json({ error: 'Auto-reply simulation failed', details: err.message });
    }
});

// Health check
app.get('/api/sms/health', (req, res) => {
    res.json({
        status: 'ok',
        modem: isModemReady ? 'connected' : 'disconnected',
        isLocalUp: isLocalUp,
        signal: signalStrength,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// Start Server
// ============================================

server.listen(PORT, '0.0.0.0', async () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           📱 icaffeOS SMS Gateway Server                  ║
╠═══════════════════════════════════════════════════════════╣
║  HTTP API:     http://localhost:${PORT}                     ║
║  WebSocket:    ws://localhost:${PORT}                       ║
║  Modem Path:   ${MODEM_PATH.padEnd(36)}║
║  Local Up:     ${(isLocalUp ? 'YES' : 'NO').padEnd(36)}║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Initialize modem
    await initModem();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    if (serialPort && serialPort.isOpen) {
        serialPort.close();
    }
    process.exit(0);
});

export default app;
