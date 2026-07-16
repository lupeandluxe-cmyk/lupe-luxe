const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');

const INTERNAL_JWT_SECRET = process.env.INTERNAL_JWT_SECRET || process.env.JWT_SECRET + '_internal';
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

function generateAccessToken(id) {
  return jwt.sign({ id, type: 'internal_access' }, INTERNAL_JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

function generateRefreshToken(id) {
  return jwt.sign({ id, type: 'internal_refresh' }, INTERNAL_JWT_SECRET + '_refresh', { expiresIn: REFRESH_EXPIRY });
}

function generateTokenPair(id) {
  return { token: generateAccessToken(id), refreshToken: generateRefreshToken(id) };
}

async function logActivity(employeeId, action, module, details = {}) {
  try {
    await ActivityLog.create({
      employee: employeeId,
      action,
      module,
      description: details.description || `${action} on ${module}`,
      targetId: details.targetId,
      targetType: details.targetType,
      ip: details.ip,
      details: details.data,
      severity: details.severity || 'info',
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

const internalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, INTERNAL_JWT_SECRET);
    if (decoded.type !== 'internal_access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    const employee = await Employee.findById(decoded.id).populate('role department');
    if (!employee) {
      return res.status(401).json({ message: 'Employee not found' });
    }
    if (!employee.isActive) {
      return res.status(403).json({ message: 'Account deactivated' });
    }

    const now = Date.now();
    if (employee.lastActivity && (now - new Date(employee.lastActivity).getTime()) > INACTIVITY_TIMEOUT) {
      return res.status(401).json({ message: 'Session expired due to inactivity' });
    }

    employee.lastActivity = new Date();
    await employee.save();
    req.employee = employee;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

function checkPermission(...required) {
  return (req, res, next) => {
    const emp = req.employee;
    if (!emp) return res.status(401).json({ message: 'Not authenticated' });

    const role = emp.role;
    if (!role) return res.status(403).json({ message: 'No role assigned' });

    const roleName = role.name?.toLowerCase();

    if (roleName === 'ceo') {
      req.hasPermission = true;
      return next();
    }

    const allowed = emp.allowedPermissions || [];
    const rolePerms = role.permissions || [];

    for (const reqPerm of required) {
      const [module, action] = reqPerm.split(':');

      const roleHas = rolePerms.some(p =>
        p.module === module && (p.actions.includes('*') || p.actions.includes(action))
      );
      const empHas = allowed.includes(reqPerm) || allowed.includes(`${module}:*`);

      if (roleHas || empHas) {
        req.hasPermission = true;
        return next();
      }
    }

    logActivity(emp._id, 'unauthorized_access', 'security', {
      description: `Blocked access to ${req.originalUrl}`,
      ip: req.ip,
      severity: 'warning',
    });

    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  };
}

const internalRefresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
  try {
    const decoded = jwt.verify(refreshToken, INTERNAL_JWT_SECRET + '_refresh');
    if (decoded.type !== 'internal_refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const employee = await Employee.findById(decoded.id).populate('role department');
    if (!employee || !employee.isActive) {
      return res.status(401).json({ message: 'Employee not found or inactive' });
    }
    res.json(generateTokenPair(employee._id));
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

module.exports = {
  internalProtect,
  checkPermission,
  generateTokenPair,
  generateAccessToken,
  internalRefresh,
  logActivity,
  INTERNAL_JWT_SECRET,
};
