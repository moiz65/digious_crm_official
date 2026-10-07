// Backend/routes/salesTiers.js

const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/salesTierController');
const authMiddleware = require('../middleware/auth');

// HR/Admin guard
const hrGuard = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  const dept = req.user?.department?.toLowerCase();
  if (role === 'admin' || role === 'administration' || dept === 'hr') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'HR/Admin access required' });
};

// ═══════════════ TIERS ═══════════════
router.get   ('/tiers',           authMiddleware, ctrl.getTiers);
router.post  ('/tiers',           authMiddleware, hrGuard, ctrl.createTier);
router.put   ('/tiers/:id',       authMiddleware, hrGuard, ctrl.updateTier);
router.delete('/tiers/:id',       authMiddleware, hrGuard, ctrl.deleteTier);

// ═══════════════ SALES EMPLOYEES ═══════════════
router.get   ('/employees',            authMiddleware, ctrl.getSalesEmployees);
router.post  ('/employees',            authMiddleware, hrGuard, ctrl.assignEmployee);
router.delete('/employees/:employeeId', authMiddleware, hrGuard, ctrl.removeSalesEmployee);
router.post  ('/employees/bulk',         authMiddleware, hrGuard, ctrl.bulkAssignEmployees);

// ═══════════════ QUARTERS ═══════════════
router.get   ('/quarters',                    authMiddleware, ctrl.getQuarters);
router.post  ('/quarters',                    authMiddleware, hrGuard, ctrl.createQuarter);
router.put   ('/quarters/:id',                authMiddleware, hrGuard, ctrl.updateQuarter);
router.delete('/quarters/:id',                authMiddleware, hrGuard, ctrl.deleteQuarter);
router.post  ('/quarters/:id/evaluate',       authMiddleware, hrGuard, ctrl.evaluateQuarter);
router.get   ('/quarters/:id/preview',        authMiddleware, hrGuard, ctrl.previewQuarter);

// ═══════════════ PERFORMANCE ═══════════════
router.get('/performance',              authMiddleware, ctrl.getQuarterPerformance);
router.get('/tier-history/:employeeId', authMiddleware, ctrl.getTierHistory);

module.exports = router;