const superAdminPermissions = {
    users: ['create', 'read', 'update', 'delete'],
    employees: ['create', 'read', 'update', 'delete'],
    clients: ['create', 'read', 'update', 'delete'],
    stock: ['create', 'read', 'update', 'delete'],
    cashflow: ['create', 'read', 'update', 'delete', 'approve'],
    expenses: ['create', 'read', 'update', 'delete', 'approve'],
    attendance: ['create', 'read', 'update', 'delete'],
    reports: ['view_all', 'export'],
    settings: ['manage_system', 'manage_permissions']
};

const adminPermissions = {
    users: ['create', 'read', 'update'], // Can't delete
    employees: ['create', 'read', 'update', 'delete'],
    clients: ['create', 'read', 'update', 'delete'],
    stock: ['create', 'read', 'update', 'delete'],
    cashflow: ['create', 'read', 'update', 'approve'], // Can't delete
    expenses: ['create', 'read', 'update', 'approve'], // Can't delete
    attendance: ['create', 'read', 'update', 'delete'],
    reports: ['view_all', 'export'],
    settings: ['manage_basic'] // No system settings
};

const subAdminPermissions = {
    users: ['read'], // View only
    employees: ['read', 'update'], // Can't create/delete
    clients: ['create', 'read', 'update'],
    stock: ['create', 'read', 'update'],
    cashflow: ['create', 'read'], // Can't approve/delete
    expenses: ['create', 'read'], // Can't approve/delete
    attendance: ['create', 'read', 'update'],
    reports: ['view_limited'], // Only their data
    settings: [] // No access
};
