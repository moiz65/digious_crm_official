/**
 * Customer Routes
 *
 * ── Customers ──
 * GET    /api/v1/customers              – list all customers (search, sort)
 * GET    /api/v1/customers/:id          – single customer detail
 * GET    /api/v1/customers/:id/history  – full sales history for a customer
 * PUT    /api/v1/customers/:id          – update customer info
 * DELETE /api/v1/customers/:id          – delete customer
 * POST   /api/v1/customers/sync         – re-sync customers from sales table
 */

const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/customerController');
const authMiddleware = require('../middleware/auth');

// Guard: admin/administration only
const adminGuard = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  if (userRole === 'admin' || userRole === 'administration' || userRole === 'sales') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Customers module is restricted to Admin/Sales only.'
  });
};

router.get   ('/',            authMiddleware, adminGuard, ctrl.getCustomers);
router.post  ('/sync',        authMiddleware, adminGuard, ctrl.syncCustomers);
router.get   ('/:id',         authMiddleware, adminGuard, ctrl.getCustomerById);
router.get   ('/:id/history', authMiddleware, adminGuard, ctrl.getCustomerHistory);
router.put   ('/:id',         authMiddleware, adminGuard, ctrl.updateCustomer);
router.delete('/:id',         authMiddleware, adminGuard, ctrl.deleteCustomer);

module.exports = router;
