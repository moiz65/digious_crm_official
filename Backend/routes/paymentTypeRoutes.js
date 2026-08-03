// Backend/routes/paymentTypeRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const paymentTypeController = require('./controllers/paymentTypeController');

router.get('/payment-types', authMiddleware, paymentTypeController.getPaymentTypes);
router.post('/payment-types', authMiddleware, paymentTypeController.createPaymentType);
router.put('/payment-types/:id', authMiddleware, paymentTypeController.updatePaymentType);
router.delete('/payment-types/:id', authMiddleware, paymentTypeController.deletePaymentType);

module.exports = router;