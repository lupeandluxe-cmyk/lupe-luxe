const express = require('express');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Department = require('../models/Department');
const InternalMessage = require('../models/InternalMessage');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { internalProtect, checkPermission, generateTokenPair, internalRefresh, logActivity } = require('../middleware/internalAuth');

const router = express.Router();

// ─── Auth ───

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const employee = await Employee.findOne({ email: email.toLowerCase().trim() }).populate('role department');
    if (!employee) return res.status(401).json({ message: 'Invalid credentials' });
    if (!employee.isActive) return res.status(403).json({ message: 'Account deactivated' });

    const match = await employee.matchPassword(password);
    if (!match) {
      await logActivity(employee._id, 'login_failed', 'auth', { description: 'Failed login attempt', ip: req.ip, severity: 'warning' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    employee.lastLogin = new Date();
    employee.loginHistory.push({ ip: req.ip, date: new Date(), device: req.headers['user-agent']?.slice(0, 100) || '' });
    if (employee.loginHistory.length > 50) employee.loginHistory = employee.loginHistory.slice(-50);
    await employee.save();

    await logActivity(employee._id, 'login', 'auth', { description: 'Logged in', ip: req.ip });

    const tokens = generateTokenPair(employee._id);
    res.json({
      employee: employee.toJSON(),
      role: employee.role,
      department: employee.department,
      ...tokens,
    });
  } catch (err) {
    console.error('Internal login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/auth/refresh', internalRefresh);

router.post('/auth/logout', internalProtect, async (req, res) => {
  req.employee.online = false;
  req.employee.socketId = null;
  await req.employee.save();
  await logActivity(req.employee._id, 'logout', 'auth', { description: 'Logged out', ip: req.ip });
  res.json({ message: 'Logged out' });
});

router.get('/auth/profile', internalProtect, async (req, res) => {
  const emp = await Employee.findById(req.employee._id).populate('role department');
  res.json({ employee: emp.toJSON(), role: emp.role, department: emp.department });
});

router.put('/auth/profile', internalProtect, async (req, res) => {
  const emp = await Employee.findById(req.employee._id);
  if (req.body.name) emp.name = req.body.name.trim();
  if (req.body.password) {
    if (req.body.password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    emp.password = req.body.password;
  }
  await emp.save();
  await logActivity(emp._id, 'profile_updated', 'auth', { description: 'Updated profile' });
  res.json(emp.toJSON());
});

// ─── Dashboard ───

router.get('/dashboard', internalProtect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, pendingOrders, assignedOrders, totalRevenue, recentOrders, tasks, unreadNotifs] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed'] } }),
      Order.countDocuments({ _id: { $in: [] } }),
      Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name'),
      Task.find({ assignedTo: req.employee._id, status: { $ne: 'completed' } }).sort({ priority: -1, deadline: 1 }).limit(10),
      Notification.countDocuments({ recipient: req.employee._id, read: false }),
    ]);

    const revenueByMonth = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    res.json({
      stats: {
        totalOrders, todayOrders, pendingOrders, assignedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        unreadNotifications: unreadNotifs,
      },
      recentOrders,
      pendingTasks: tasks,
      revenueByMonth,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// ─── Employees ───

router.get('/employees', internalProtect, checkPermission('employees:read', 'employees:*'), async (req, res) => {
  const employees = await Employee.find().populate('role department').sort({ createdAt: -1 });
  res.json(employees.map(e => e.toJSON()));
});

router.post('/employees', internalProtect, checkPermission('employees:create', 'employees:*'), async (req, res) => {
  const { name, email, password, role, department, allowedPermissions } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Name, email, password and role required' });

  const existing = await Employee.findOne({ email: email.toLowerCase().trim() });
  if (existing) return res.status(400).json({ message: 'Email already exists' });

  const targetRole = await Role.findById(role);
  if (!targetRole) return res.status(400).json({ message: 'Invalid role' });

  const emp = await Employee.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    department: department || undefined,
    allowedPermissions: allowedPermissions || [],
  });

  await logActivity(req.employee._id, 'employee_created', 'employees', {
    description: `Created employee ${emp.name}`,
    targetId: emp._id,
    targetType: 'Employee',
    data: { email: emp.email, role: targetRole.name },
  });

  res.status(201).json(emp.toJSON());
});

router.put('/employees/:id', internalProtect, checkPermission('employees:update', 'employees:*'), async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).json({ message: 'Employee not found' });

  const empRole = await Role.findById(emp.role);
  if (empRole?.name === 'CEO' && req.employee.role?.name !== 'CEO') {
    return res.status(403).json({ message: 'Cannot modify CEO' });
  }

  const allowed = ['name', 'email', 'role', 'department', 'isActive', 'allowedPermissions', 'twoFactorEnabled'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) emp[key] = req.body[key];
  }
  if (req.body.password) {
    if (req.body.password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    emp.password = req.body.password;
  }

  await emp.save();
  await logActivity(req.employee._id, 'employee_updated', 'employees', {
    description: `Updated employee ${emp.name}`,
    targetId: emp._id, targetType: 'Employee',
  });
  res.json(emp.toJSON());
});

router.delete('/employees/:id', internalProtect, checkPermission('employees:delete', 'employees:*'), async (req, res) => {
  const emp = await Employee.findById(req.params.id).populate('role');
  if (!emp) return res.status(404).json({ message: 'Employee not found' });
  if (emp.role?.name === 'CEO') return res.status(403).json({ message: 'Cannot delete CEO' });

  await logActivity(req.employee._id, 'employee_deleted', 'employees', {
    description: `Deleted employee ${emp.name}`,
    targetId: emp._id, targetType: 'Employee',
    severity: 'critical',
  });

  await Employee.findByIdAndDelete(req.params.id);
  res.json({ message: 'Employee deleted' });
});

router.get('/employees/online', internalProtect, async (req, res) => {
  const online = await Employee.find({ online: true, isActive: true }).select('name email role department');
  res.json(online);
});

// ─── Roles ───

router.get('/roles', internalProtect, checkPermission('roles:read', 'roles:*', 'employees:*'), async (req, res) => {
  const roles = await Role.find().sort({ priority: -1 });
  res.json(roles);
});

router.post('/roles', internalProtect, checkPermission('roles:create', 'roles:*'), async (req, res) => {
  const role = await Role.create(req.body);
  res.status(201).json(role);
});

router.put('/roles/:id', internalProtect, checkPermission('roles:update', 'roles:*'), async (req, res) => {
  const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(role);
});

router.delete('/roles/:id', internalProtect, checkPermission('roles:delete', 'roles:*'), async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (role?.isSystem) return res.status(400).json({ message: 'Cannot delete system role' });
  await Role.findByIdAndDelete(req.params.id);
  res.json({ message: 'Role deleted' });
});

// ─── Departments ───

router.get('/departments', internalProtect, async (req, res) => {
  const deps = await Department.find().populate('head', 'name email');
  res.json(deps);
});

router.post('/departments', internalProtect, checkPermission('departments:create', 'departments:*'), async (req, res) => {
  const dep = await Department.create(req.body);
  res.status(201).json(dep);
});

router.put('/departments/:id', internalProtect, checkPermission('departments:update', 'departments:*'), async (req, res) => {
  const dep = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(dep);
});

router.delete('/departments/:id', internalProtect, checkPermission('departments:delete', 'departments:*'), async (req, res) => {
  await Department.findByIdAndDelete(req.params.id);
  res.json({ message: 'Department deleted' });
});

// ─── Orders ───

router.get('/orders', internalProtect, checkPermission('orders:read', 'orders:*'), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;
  const search = req.query.search;

  const filter = {};
  if (status && status !== 'all') filter.orderStatus = status;
  if (search) {
    filter.$or = [
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      { 'items.name': { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ orders, page, pages: Math.ceil(total / limit), total });
});

router.get('/orders/:id', internalProtect, checkPermission('orders:read', 'orders:*'), async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

router.put('/orders/:id/status', internalProtect, checkPermission('orders:update', 'orders:*'), async (req, res) => {
  const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
  const { orderStatus, trackingNumber } = req.body;
  if (!allowedStatuses.includes(orderStatus)) return res.status(400).json({ message: 'Invalid status' });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.orderStatus = orderStatus;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (orderStatus === 'delivered') { order.isDelivered = true; order.deliveredAt = Date.now(); }
  if (['cancelled', 'returned'].includes(orderStatus)) order.isPaid = false;
  await order.save();

  await logActivity(req.employee._id, 'order_status_updated', 'orders', {
    description: `Order ${order._id} status → ${orderStatus}`,
    targetId: order._id, targetType: 'Order',
    data: { status: orderStatus },
  });

  res.json(order);
});

router.put('/orders/:id/assign', internalProtect, checkPermission('orders:update', 'orders:*'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.assignedTo = req.employee._id;
  order.assignedAt = Date.now();
  await order.save();

  await logActivity(req.employee._id, 'order_assigned', 'orders', {
    description: `Assigned order ${order._id} to self`,
    targetId: order._id, targetType: 'Order',
  });

  res.json(order);
});

router.put('/orders/:id/upi-verify', internalProtect, checkPermission('payments:verify', 'payments:*'), async (req, res) => {
  const { status } = req.body;
  if (!['verified', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.upiPaymentStatus = status;
  if (status === 'verified') {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'confirmed';
  }
  await order.save();

  await logActivity(req.employee._id, 'upi_verified', 'payments', {
    description: `UPI payment ${status} for order ${order._id}`,
    targetId: order._id, targetType: 'Order',
    data: { status },
  });

  res.json(order);
});

// ─── Products ───

router.get('/products', internalProtect, checkPermission('products:read', 'products:*'), async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.json(products);
});

router.post('/products', internalProtect, checkPermission('products:create', 'products:*'), async (req, res) => {
  const product = await Product.create(req.body);
  await logActivity(req.employee._id, 'product_created', 'products', {
    description: `Created product ${product.name}`,
    targetId: product._id, targetType: 'Product',
  });
  res.status(201).json(product);
});

router.put('/products/:id', internalProtect, checkPermission('products:update', 'products:*'), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  await logActivity(req.employee._id, 'product_updated', 'products', {
    description: `Updated product ${product.name}`,
    targetId: product._id, targetType: 'Product',
  });
  res.json(product);
});

router.delete('/products/:id', internalProtect, checkPermission('products:delete', 'products:*'), async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  await logActivity(req.employee._id, 'product_deleted', 'products', {
    description: `Deleted product ${product.name}`, targetId: product._id, targetType: 'Product',
    severity: 'warning',
  });
  res.json({ message: 'Product deleted' });
});

// ─── Messages (Chat) ───

router.get('/messages', internalProtect, async (req, res) => {
  const { type, recipient, department } = req.query;
  const filter = {};

  if (type) filter.type = type;
  if (recipient) {
    filter.$or = [
      { sender: recipient, recipients: req.employee._id },
      { sender: req.employee._id, recipients: recipient },
    ];
    filter.type = 'private';
  }
  if (department) filter.department = department;
  if (!recipient && !department) {
    filter.$or = [
      { recipients: req.employee._id },
      { type: 'broadcast' },
      { department: req.employee.department?._id || req.employee.department },
    ];
  }

  const messages = await InternalMessage.find(filter)
    .populate('sender', 'name email role')
    .populate('recipients', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(messages.reverse());
});

router.post('/messages', internalProtect, async (req, res) => {
  const { text, type, recipients, department, attachments } = req.body;
  if (!text && !attachments?.length) return res.status(400).json({ message: 'Message or attachment required' });

  if (type === 'broadcast') {
    const empRole = await Role.findById(req.employee.role);
    if (empRole?.name !== 'CEO') return res.status(403).json({ message: 'Only CEO can broadcast' });
  }

  const msg = await InternalMessage.create({
    sender: req.employee._id,
    text: text || '',
    type: type || 'private',
    recipients: recipients || [],
    department: department || undefined,
    attachments: attachments || [],
  });

  const populated = await InternalMessage.findById(msg._id)
    .populate('sender', 'name email role')
    .populate('recipients', 'name email');

  res.status(201).json(populated);
});

router.put('/messages/:id/read', internalProtect, async (req, res) => {
  const msg = await InternalMessage.findById(req.params.id);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  const alreadyRead = msg.readBy.some(r => r.employee.toString() === req.employee._id.toString());
  if (!alreadyRead) {
    msg.readBy.push({ employee: req.employee._id });
    await msg.save();
  }
  res.json({ read: true });
});

router.put('/messages/:id/pin', internalProtect, checkPermission('messages:pin', 'messages:*'), async (req, res) => {
  const msg = await InternalMessage.findByIdAndUpdate(req.params.id, { pinned: true }, { new: true });
  res.json(msg);
});

// ─── Notifications ───

router.get('/notifications', internalProtect, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {
    $or: [{ recipient: req.employee._id }, { broadcastTo: 'all' }],
  };
  if (req.query.unread === 'true') filter.read = false;
  const [notifs, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.employee._id, read: false }),
  ]);
  res.json({ notifications: notifs, total, unread, page, pages: Math.ceil(total / limit) });
});

router.put('/notifications/read-all', internalProtect, async (req, res) => {
  await Notification.updateMany(
    { recipient: req.employee._id, read: false },
    { read: true, readAt: new Date() }
  );
  res.json({ message: 'All notifications marked read' });
});

router.put('/notifications/:id/read', internalProtect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true, readAt: new Date() });
  res.json({ message: 'Marked read' });
});

// ─── Tasks ───

router.get('/tasks', internalProtect, async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.mine === 'true') filter.assignedTo = req.employee._id;
  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .sort({ priority: -1, deadline: 1 });
  res.json(tasks);
});

router.post('/tasks', internalProtect, checkPermission('tasks:create', 'tasks:*'), async (req, res) => {
  const { title, description, assignedTo, department, deadline, priority, relatedOrder } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });

  const task = await Task.create({
    title: title.trim(),
    description,
    assignedTo: assignedTo || [],
    assignedBy: req.employee._id,
    department,
    deadline: deadline || undefined,
    priority: priority || 'medium',
    relatedOrder,
  });

  await logActivity(req.employee._id, 'task_created', 'tasks', {
    description: `Created task: ${task.title}`,
    targetId: task._id, targetType: 'Task',
  });

  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');
  res.status(201).json(populated);
});

router.put('/tasks/:id', internalProtect, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isAssigned = task.assignedTo.some(a => a.toString() === req.employee._id.toString());
  const canEdit = req.employee.role?.name === 'CEO' || isAssigned || req.employee.allowedPermissions?.includes('tasks:update') || req.employee.allowedPermissions?.includes('tasks:*');

  if (!canEdit) return res.status(403).json({ message: 'Not authorized' });

  const allowed = ['title', 'description', 'status', 'priority', 'deadline', 'assignedTo', 'department'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) task[key] = req.body[key];
  }
  if (req.body.status === 'completed') task.completedAt = new Date();
  if (req.body.notes) {
    task.notes = task.notes || [];
    task.notes.push({ text: req.body.notes, by: req.employee._id });
  }
  await task.save();

  await logActivity(req.employee._id, 'task_updated', 'tasks', {
    description: `Updated task: ${task.title}`,
    targetId: task._id, targetType: 'Task',
    data: { status: task.status },
  });

  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');
  res.json(populated);
});

router.post('/tasks/:id/proof', internalProtect, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const { url, description } = req.body;
  if (!url) return res.status(400).json({ message: 'URL required' });
  task.proof.push({ url, description, uploadedAt: new Date() });
  await task.save();
  res.json(task);
});

// ─── Activity Log ───

router.get('/activity', internalProtect, checkPermission('activity:read', 'activity:*'), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const filter = {};
  if (req.query.module) filter.module = req.query.module;
  if (req.query.severity) filter.severity = req.query.severity;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter).populate('employee', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ActivityLog.countDocuments(filter),
  ]);
  res.json({ logs, total, page, pages: Math.ceil(total / limit) });
});

// ─── Seed default roles ───

router.post('/seed', async (req, res) => {
  const existing = await Role.findOne({ name: 'CEO' });
  if (existing) return res.json({ message: 'Already seeded' });
  try {
    const roles = await Role.create([
      {
        name: 'CEO', isSystem: true, priority: 100,
        description: 'Full access to everything',
        permissions: [{ module: '*', actions: ['*'] }],
      },
      {
        name: 'Admin', isSystem: true, priority: 50,
        description: 'Manage orders, products, payments, reports',
        permissions: [
          { module: 'orders', actions: ['*'] },
          { module: 'products', actions: ['*'] },
          { module: 'payments', actions: ['*'] },
          { module: 'reports', actions: ['*'] },
          { module: 'messages', actions: ['*'] },
          { module: 'tasks', actions: ['*'] },
          { module: 'chat', actions: ['*'] },
        ],
      },
      {
        name: 'Employee', isSystem: true, priority: 10,
        description: 'Configurable permissions',
        permissions: [
          { module: 'orders', actions: ['read'] },
          { module: 'chat', actions: ['read', 'write'] },
          { module: 'tasks', actions: ['read', 'update'] },
        ],
      },
    ]);
    res.json({ message: 'Default roles created', roles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
