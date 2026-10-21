const expenseAccess = (req, res, next) => {
  const role = String(req.user?.role || '').trim().toLowerCase();
  const designation = String(req.user?.designation || '').trim().toLowerCase();

  if (
    role === 'admin' ||
    role === 'administration' ||
    designation === 'operations manager'
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Expense management is restricted to administrators and Business Unit Heads.'
  });
};

module.exports = expenseAccess;
