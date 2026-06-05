/**
 * Client Routes (alias for customers table, invoice UI format)
 *
 * GET  /api/v1/clients       – list customers as clients { id, name, email, phone, address }
 * POST /api/v1/clients       – create a new customer/client
 */

const express = require('express');
const router = express.Router();
const invoiceCtrl = require('./controllers/invoiceController');
const customerCtrl = require('./controllers/customerController');
const authMiddleware = require('../middleware/auth');

const adminGuard = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  if (userRole === 'admin' || userRole === 'administration' || userRole === 'sales') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Clients module is restricted to Admin/Sales only.',
  });
};

router.get('/', authMiddleware, adminGuard, invoiceCtrl.getClients);
router.post('/', authMiddleware, adminGuard, customerCtrl.createCustomer);

module.exports = router;
