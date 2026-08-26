module.exports = {
    cors: {
        origin: ['http://localhost:3000', 'http://100.114.9.93:5000'],
        credentials: true,
        methods: ['GET', 'POST']
    },
    maxHttpBufferSize: 1e8, // 100 MB
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
};