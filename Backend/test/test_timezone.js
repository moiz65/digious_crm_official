const { getPakistanDate, getPakistanDateString, getPakistanTimeString } = require('../utils/timezone');

const now = getPakistanDate();
console.log('Pakistan Date:', now);
console.log('Pakistan Date String:', getPakistanDateString());
console.log('Pakistan Time String:', getPakistanTimeString());
console.log('Current Hour (UTC):', now.getUTCHours());
console.log('Current Hour (Local):', now.getHours());

const systemDate = new Date();
console.log('\nSystem Date:', systemDate);
console.log('System Hour (UTC):', systemDate.getUTCHours());
console.log('System Hour (Local):', systemDate.getHours());
