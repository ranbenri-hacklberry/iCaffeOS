const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const MODEM_PATH = '/dev/cu.usbmodem0000000000017';
const BAUD_RATE = 115200;
const TARGET = '0506018373';

const port = new SerialPort({
    path: MODEM_PATH,
    baudRate: BAUD_RATE
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

function waitFor(pattern, timeout = 10000) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            parser.off('data', onData);
            resolve('TIMEOUT');
        }, timeout);

        function onData(line) {
            console.log(`📥 ${line}`);
            if (line.includes(pattern) || line.includes('ERROR') || line.includes('NO CARRIER') || line.includes('BUSY')) {
                // Keep listening for a bit if it's NO CARRIER just to see context
                clearTimeout(timer);
                parser.off('data', onData);
                resolve(line);
            }
        }
        parser.on('data', onData);
    });
}

async function sendAT(cmd, waitPattern = 'OK') {
    console.log(`\n📤 ${cmd}`);
    port.write(`${cmd}\r`);
    if (waitPattern) return waitFor(waitPattern);
}

async function tryCall() {
    try {
        console.log('--- WAVESHARE VOICE CALL ATTEMPT ---');

        await sendAT('AT', 'OK');

        // 1. Reset Audio Service (Optional but good)
        // AT+CSDVC=1 -> Switch to headset/external? 
        // Let's try to query current mode
        // await sendAT('AT+CSDVC?', 'OK');

        // 2. Try standard call with semicolon
        console.log(`\n📞 Dialing ${TARGET}...`);

        // Some modems require international, some local.
        // Let's try local first as it's a mobile number.
        // Important: Waveshare/Simcom often needs the ; at the end using the GSM character set.

        port.write(`ATD${TARGET};\r`);

        // Wait for connection or error
        const res = await waitFor('aaaaa', 20000); // Wait long, look for anything

        if (res === 'TIMEOUT') {
            console.log('Timeout waiting for response. Maybe connected? Hanging up...');
            await sendAT('ATH', 'OK');
        } else {
            console.log(`Result: ${res}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        port.close();
    }
}

tryCall();
