/**
 * Invoice Routes
 *
 * GET    /api/v1/invoices              – list invoices (search, filters, stats)
 * GET    /api/v1/invoices/stats        – summary stats
 * GET    /api/v1/invoices/:id          – single invoice with items
 * POST   /api/v1/invoices              – create invoice
 * PUT    /api/v1/invoices/:id          – update invoice
 * PATCH  /api/v1/invoices/:id/status   – update status / paid amount
 * DELETE /api/v1/invoices/:id          – delete invoice
 */

const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/invoiceController');
const authMiddleware = require('../middleware/auth');

const adminGuard = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase();
  if (userRole === 'admin' || userRole === 'administration' || userRole === 'sales') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Invoice module is restricted to Admin/Sales only.',
  });
};

router.get('/stats', authMiddleware, adminGuard, ctrl.getInvoiceStats);
router.get('/', authMiddleware, adminGuard, ctrl.getInvoices);
router.get('/:id', authMiddleware, adminGuard, ctrl.getInvoiceById);
router.post('/', authMiddleware, adminGuard, ctrl.createInvoice);
router.put('/:id', authMiddleware, adminGuard, ctrl.updateInvoice);
router.patch('/:id/status', authMiddleware, adminGuard, ctrl.updateInvoiceStatus);
router.delete('/:id', authMiddleware, adminGuard, ctrl.deleteInvoice);

module.exports = router;
