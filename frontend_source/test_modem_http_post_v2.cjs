const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const MODEM_PATH = '/dev/cu.usbmodem0000000000017';
const BAUD_RATE = 115200;

const port = new SerialPort({
    path: MODEM_PATH,
    baudRate: BAUD_RATE
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

function waitFor(pattern, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            parser.off('data', onData);
            resolve('TIMEOUT');
        }, timeout);

        function onData(line) {
            console.log(`📥 ${line}`);
            if (line.includes(pattern) || line.includes('ERROR') || line.includes('+HTTPACTION:')) {
                if (line.includes('+HTTPACTION:') || line.includes('DOWNLOAD')) {
                    clearTimeout(timer);
                    parser.off('data', onData);
                    resolve(line);
                } else if (line.includes('ERROR') || line.includes(pattern)) {
                    clearTimeout(timer);
                    parser.off('data', onData);
                    resolve(line);
                }
            }
        }
        parser.on('data', onData);
    });
}

async function sendAT(cmd, pattern = 'OK') {
    console.log(`\n📤 ${cmd}`);
    port.write(`${cmd}\r`);
    return waitFor(pattern);
}

async function runHttpPostTest() {
    try {
        console.log('--- MODEM HTTP POST TEST ---');

        await sendAT('AT', 'OK');
        await sendAT('AT+HTTPTERM', 'OK'); // Ensure clean state
        await sendAT('AT+HTTPINIT', 'OK');

        // URL (Postman Echo for testing)
        console.log('\n[1] Setting URL...');
        await sendAT('AT+HTTPPARA="URL","https://postman-echo.com/post"', 'OK');

        // Content Type
        console.log('\n[2] Setting Content-Type...');
        await sendAT('AT+HTTPPARA="CONTENT","application/json"', 'OK');

        // Prepare Data
        const payload = JSON.stringify({ phone: "0501234567", message: "Test from Modem HTTP" });
        const len = payload.length;
        const time = 10000; // 10s timeout for input

        console.log(`\n[3] Preparing Data upload (${len} bytes)...`);
        const dataRes = await sendAT(`AT+HTTPDATA=${len},${time}`, 'DOWNLOAD');

        if (dataRes.includes('DOWNLOAD')) {
            console.log('\n[4] Sending Payload...');
            port.write(payload);
            await waitFor('OK'); // Wait for OK after data
        } else {
            console.log('Failed to get DOWNLOAD prompt');
        }

        // POST Action (1)
        console.log('\n[5] Performing HTTP POST...');
        const actionRes = await sendAT('AT+HTTPACTION=1', '+HTTPACTION:');
        console.log(`Action Result: ${actionRes}`);

        // Read Response
        if (actionRes.includes('+HTTPACTION: 1,200')) {
            console.log('\n[6] Reading Response...');
            const readRes = await sendAT('AT+HTTPREAD=0,500', 'OK'); // Read up to 500 bytes
            console.log(`Response Body:\n${readRes}`);
        } else {
            console.log('HTTP POST Failed or not 200 OK');
        }

        await sendAT('AT+HTTPTERM', 'OK');

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        port.close();
    }
}

runHttpPostTest();
