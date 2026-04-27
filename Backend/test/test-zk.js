// test-zk.js
import ZKLib from 'node-zklib';

async function test() {
    const zk = new ZKLib('192.168.1.100', 4370, 10000, 5200);
    
    try {
        console.log('Attempting to connect...');
        await zk.createSocket();
        console.log('✅ Socket created!');
        
        const info = await zk.getInfo();
        console.log('Device Info:', info);
        
        await zk.disconnect();
        console.log('✅ Test passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.message && error.message.includes('subarray')) {
            console.log('💡 This usually means device is incompatible or network issue');
        }
    }
}

test();