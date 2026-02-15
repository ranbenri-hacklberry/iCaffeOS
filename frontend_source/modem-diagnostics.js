/**
 * Modem Diagnostics Script
 * Run this to diagnose SMS sending issues on SIM7670G
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const MODEM_PATH = process.env.MODEM_PATH || '/dev/cu.usbmodem0000000000017';
const BAUD_RATE = 115200;

let serialPort;
let parser;
let responseBuffer = [];
let pendingResolve = null;

async function sendAT(command, timeout = 3000) {
    return new Promise((resolve, reject) => {
        responseBuffer = [];

        const timer = setTimeout(() => {
            pendingResolve = null;
            resolve({ command, response: responseBuffer.join('\n'), status: 'TIMEOUT' });
        }, timeout);

        pendingResolve = (lines) => {
            clearTimeout(timer);
            pendingResolve = null;
            resolve({ command, response: lines.join('\n'), status: 'OK' });
        };

        console.log(`\n📤 ${command}`);
        serialPort.write(command + '\r\n');
    });
}

function handleData(line) {
    const trimmed = line.trim();
    if (!trimmed) return;

    console.log(`   📥 ${trimmed}`);
    responseBuffer.push(trimmed);

    if (trimmed === 'OK' || trimmed === 'ERROR' || trimmed.startsWith('+CME ERROR') || trimmed.startsWith('+CMS ERROR')) {
        if (pendingResolve) {
            pendingResolve(responseBuffer);
        }
    }
}

async function runDiagnostics() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║       🔬 SIM7670G Modem Diagnostics for SMS               ║
╚═══════════════════════════════════════════════════════════╝
`);

    try {
        serialPort = new SerialPort({
            path: MODEM_PATH,
            baudRate: BAUD_RATE,
            autoOpen: false
        });

        parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        parser.on('data', handleData);

        await new Promise((resolve, reject) => {
            serialPort.open((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('✅ Serial port opened\n');
        await new Promise(r => setTimeout(r, 2000));

        // ===== BASIC MODEM INFO =====
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📱 BASIC MODEM INFO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await sendAT('AT');
        await sendAT('ATI');                    // Modem info
        await sendAT('AT+CGMI');                // Manufacturer
        await sendAT('AT+CGMM');                // Model
        await sendAT('AT+CGMR');                // Firmware version
        await sendAT('AT+CGSN');                // IMEI

        // ===== SIM STATUS =====
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💳 SIM CARD STATUS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await sendAT('AT+CPIN?');               // SIM PIN status
        await sendAT('AT+CCID');                // SIM ICCID
        await sendAT('AT+CNUM');                // Own phone number
        await sendAT('AT+CIMI');                // IMSI

        // ===== NETWORK STATUS =====
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 NETWORK REGISTRATION STATUS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await sendAT('AT+CREG?');               // 2G/3G registration
        await sendAT('AT+CGREG?');              // GPRS registration
        await sendAT('AT+CEREG?');              // LTE/EPS registration
        await sendAT('AT+COPS?');               // Current operator
        await sendAT('AT+CSQ');                 // Signal quality
        await sendAT('AT+CPSI?');               // System info (LTE bands, etc)

        // ===== SMS CONFIGURATION =====
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📨 SMS CONFIGURATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await sendAT('AT+CMGF?');               // SMS mode (0=PDU, 1=Text)
        await sendAT('AT+CSCA?');               // SMS Service Center
        await sendAT('AT+CSCS?');               // Character set
        await sendAT('AT+CSMP?');               // SMS text mode params
        await sendAT('AT+CPMS?');               // SMS storage
        await sendAT('AT+CNMI?');               // New message indications

        // ===== LTE SMS SPECIFIC =====
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📶 LTE/IMS SMS SETTINGS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await sendAT('AT+CGSMS?');              // SMS service preference (1=PS, 2=CS, 3=both)
        await sendAT('AT+CGSMS=?');             // Supported modes

        // SIM7670G specific
        await sendAT('AT+SIMCOMATI');           // Extended SIMCOM info
        await sendAT('AT+CSMSINFO?');           // SMS info (if supported)

        // Check IMS status
        await sendAT('AT+CIREG?');              // IMS registration (if supported)

        // ===== PELEPHONE SMSC ATTEMPTS =====
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📞 PELEPHONE SMSC CONFIGURATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Known Pelephone SMSC numbers - try different formats
        const smscOptions = [
            '+972505000003',      // Pelephone standard
            '+972526000000',      // Alternative
            '+972542000000',      // Alternative 2
        ];

        console.log('\nCurrent SMSC:');
        await sendAT('AT+CSCA?');

        // ===== TEST SMS SEND SEQUENCE =====
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🧪 SMS SEND CAPABILITY TEST');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Try different SMS domain settings
        console.log('\n🔧 Testing SMS Domain Settings...');

        // Option 1: Force Circuit-Switched (CS) domain
        console.log('\n[Test 1] Force CS Domain (AT+CGSMS=2):');
        await sendAT('AT+CGSMS=2', 2000);

        // Option 2: Force Packet-Switched (PS/LTE) domain
        console.log('\n[Test 2] Force PS Domain (AT+CGSMS=1):');
        await sendAT('AT+CGSMS=1', 2000);

        // Option 3: Let modem choose
        console.log('\n[Test 3] Auto Domain (AT+CGSMS=3):');
        await sendAT('AT+CGSMS=3', 2000);

        // ===== ERROR CODE LOOKUP =====
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 CMS ERROR REFERENCE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`
Common +CMS ERROR codes:
  1   = Unassigned number
  8   = Operator barring
  10  = Call barred
  21  = Short message transfer rejected
  27  = Destination out of service
  28  = Unidentified subscriber
  29  = Facility rejected
  30  = Unknown subscriber
  38  = Network out of order
  41  = Temporary failure
  42  = Congestion
  47  = Resources unavailable
  50  = Facility not subscribed
  69  = Facility not implemented
  81  = Invalid short message transfer ref
  95  = Invalid message (unspecified)
  96  = Invalid mandatory information
  97  = Message type non existent
  98  = Message not compatible
  99  = Information element non existent
  111 = Protocol error
  127 = Interworking (unspecified)
  128 = Telematic interworking not supported
  129 = Short message Type 0 not supported
  130 = Cannot replace message
  143 = Unspecified TP-PID error
  144 = Data coding scheme not supported
  145 = Message class not supported
  159 = Unspecified TP-DCS error
  160 = Command cannot be actioned
  161 = Command unsupported
  175 = Unspecified TP-Command error
  176 = TPDU not supported
  192 = SC busy
  193 = No SC subscription
  194 = SC system failure
  195 = Invalid SME address
  196 = Destination SME barred
  197 = SM Rejected-Duplicate SM
  198 = TP-VPF not supported
  199 = TP-VP not supported
  208 = SIM SMS storage full
  209 = No SMS storage capability in SIM
  210 = Error in MS
  211 = Memory Capacity Exceeded
  255 = Unspecified error
  300 = ME failure
  301 = SMS service of ME reserved
  302 = Operation not allowed
  303 = Operation not supported
  304 = Invalid PDU mode parameter
  305 = Invalid text mode parameter
  310 = SIM not inserted
  311 = SIM PIN required
  312 = PH-SIM PIN required
  313 = SIM failure
  314 = SIM busy
  315 = SIM wrong
  316 = SIM PUK required
  317 = SIM PIN2 required
  318 = SIM PUK2 required
  320 = Memory failure
  321 = Invalid memory index
  322 = Memory full
  330 = SMSC address unknown
  331 = No network service
  332 = Network timeout
  340 = No +CNMA ack expected
  500 = Unknown error
`);

        // ===== FINAL RECOMMENDATION =====
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💡 RECOMMENDATIONS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`
Based on CREG=0,6 (EPS only registration), try these solutions:

1. **Force Circuit-Switched SMS:**
   AT+CGSMS=2
   (Forces SMS over traditional GSM/3G network)

2. **Set correct SMSC for Pelephone:**
   AT+CSCA="+972505000003",145
   (145 = international format type)

3. **If on VoLTE-only, check IMS status:**
   AT+CIREG?
   (May need VoLTE/IMS to be active for SMS)

4. **Try network re-registration:**
   AT+COPS=2
   (wait 3 sec)
   AT+COPS=0
   (Force network re-scan)

5. **Contact Pelephone:**
   The SIM might need SMS service activated separately
   or might be restricted to specific SMS routes.
`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (serialPort && serialPort.isOpen) {
            serialPort.close();
            console.log('\n✅ Serial port closed');
        }
    }
}

runDiagnostics().catch(console.error);
