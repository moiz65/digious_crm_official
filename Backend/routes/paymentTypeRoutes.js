// Backend/routes/paymentTypeRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const expenseAccess = require('../middleware/expenseAccess');
const paymentTypeController = require('./controllers/paymentTypeController');

router.use(authMiddleware, expenseAccess);

router.get('/payment-types', paymentTypeController.getPaymentTypes);
router.post('/payment-types', paymentTypeController.createPaymentType);
router.put('/payment-types/:id', paymentTypeController.updatePaymentType);
router.delete('/payment-types/:id', paymentTypeController.deletePaymentType);

module.exports = router;