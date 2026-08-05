const db = require('../db');

async function runMultiTenancyMigration() {
  console.log('🏢 Running Multi-Tenancy & RBAC migrations...\n');

  try {
    // 1. Add role column to users table
    const { rows: roleCheck } = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
      )
    `);

    if (!roleCheck[0].exists) {
      await db.query(`ALTER TABLE users ADD COLUMN role VARCHAR(30) DEFAULT 'citizen'`);
      await db.query(`ALTER TABLE users ADD COLUMN tenant_id VARCHAR(100)`);
      console.log('✅ Added role and tenant_id to users table');

      // Set existing users' roles based on their existing data
      await db.query(`UPDATE users SET role = 'super_admin' WHERE email = 'admin@majismart.ke'`);
      await db.query(`UPDATE users SET role = 'county_admin', tenant_id = county WHERE county IS NOT NULL AND role = 'citizen'`);
      await db.query(`UPDATE users SET tenant_id = county WHERE county IS NOT NULL`);
      console.log('✅ Migrated existing users to roles and tenants');
    }

    // 2. Add tenant_id to tenant-scoped tables
    const tenantScopedTables = [
      { table: 'assets', defaultTenant: 'Nairobi' },
      { table: 'sensors', defaultTenant: 'Nairobi' },
      { table: 'work_orders', defaultTenant: 'Nairobi' },
      { table: 'reports', defaultTenant: 'Nairobi' },
      { table: 'sensor_alerts', defaultTenant: 'Nairobi' }
    ];

    for (const { table, defaultTenant } of tenantScopedTables) {
      const { rows: check } = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = 'tenant_id'
        )
      `);

      if (!check[0].exists) {
        // Check if table exists first
        const { rows: tableExists } = await db.query(`
          SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}')
        `);
        
        if (tableExists[0].exists) {
          await db.query(`ALTER TABLE ${table} ADD COLUMN tenant_id VARCHAR(100) DEFAULT '${defaultTenant}'`);
          await db.query(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table} (tenant_id)`);
          console.log(`✅ Added tenant_id to ${table}`);
        }
      }
    }

    // 3. Create permissions table for fine-grained access control
    await db.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(30) NOT NULL,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(20) NOT NULL,
        UNIQUE(role, resource, action)
      )
    `);

    // 4. Seed default permissions
    const permissions = [
      // Super admin - everything
      ['super_admin', '*', '*'],
      
      // County admin - full county access
      ['county_admin', 'assets', 'read'],
      ['county_admin', 'assets', 'write'],
      ['county_admin', 'sensors', 'read'],
      ['county_admin', 'sensors', 'write'],
      ['county_admin', 'work_orders', 'read'],
      ['county_admin', 'work_orders', 'write'],
      ['county_admin', 'reports', 'read'],
      ['county_admin', 'reports', 'write'],
      ['county_admin', 'users', 'read'],
      ['county_admin', 'users', 'write'],
      ['county_admin', 'analytics', 'read'],
      
      // Operator - operational access
      ['operator', 'assets', 'read'],
      ['operator', 'sensors', 'read'],
      ['operator', 'work_orders', 'read'],
      ['operator', 'work_orders', 'write'],
      ['operator', 'reports', 'read'],
      ['operator', 'reports', 'write'],
      ['operator', 'analytics', 'read'],
      
      // Technician - field access
      ['technician', 'assets', 'read'],
      ['technician', 'work_orders', 'read'],
      ['technician', 'work_orders', 'write'],
      ['technician', 'sensors', 'read'],
      
      // Citizen - limited access
      ['citizen', 'reports', 'read'],
      ['citizen', 'reports', 'write'],
      ['citizen', 'assets', 'read'],
      ['citizen', 'sensors', 'read'],
      
      // Viewer - read-only
      ['viewer', 'assets', 'read'],
      ['viewer', 'sensors', 'read'],
      ['viewer', 'reports', 'read']
    ];

    for (const [role, resource, action] of permissions) {
      await db.query(
        `INSERT INTO role_permissions (role, resource, action) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [role, resource, action]
      );
    }
    console.log(`✅ Seeded ${permissions.length} role permissions`);

    console.log('\n🎉 Multi-Tenancy & RBAC migrations completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Multi-tenancy migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMultiTenancyMigration();
