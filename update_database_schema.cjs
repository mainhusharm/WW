const { Pool } = require('pg');
const fs = require('fs');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_user:3hHx4ds9FeT4E7SNGr3w9rcPplymI1Ce@dpg-d31suqndiees7388j8s0-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a',
  ssl: { rejectUnauthorized: false }
});

async function updateDatabaseSchema() {
  try {
    console.log('Updating database schema to match working version...');
    const client = await pool.connect();
    
    // Add missing columns to users table
    console.log('Adding missing columns to users table...');
    
    const alterQueries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(200)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS trading_experience VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS trading_goals TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_tolerance VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_markets VARCHAR(100)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS trading_style VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS agree_to_marketing BOOLEAN DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS normalized_email VARCHAR(255)`
    ];
    
    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log('✅ Added column successfully');
      } catch (error) {
        if (error.code === '42701') {
          console.log('⚠️ Column already exists, skipping');
        } else {
          console.error('❌ Error adding column:', error.message);
        }
      }
    }
    
    // Add indexes if they don't exist
    console.log('Adding indexes...');
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid)`,
      `CREATE INDEX IF NOT EXISTS idx_users_normalized_email ON users(normalized_email)`
    ];
    
    for (const query of indexQueries) {
      try {
        await client.query(query);
        console.log('✅ Index created successfully');
      } catch (error) {
        console.log('⚠️ Index may already exist');
      }
    }
    
    // Update existing users to have normalized_email
    console.log('Updating existing users...');
    await client.query(`
      UPDATE users 
      SET normalized_email = LOWER(email) 
      WHERE normalized_email IS NULL
    `);
    
    // Check final structure
    const userColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated users table structure:');
    userColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    client.release();
    await pool.end();
    console.log('\n🎉 Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    await pool.end();
  }
}

updateDatabaseSchema();
