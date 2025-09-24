const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_user:3hHx4ds9FeT4E7SNGr3w9rcPplymI1Ce@dpg-d31suqndiees7388j8s0-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a',
  ssl: { rejectUnauthorized: false }
});

async function checkTableStructure() {
  try {
    console.log('Checking table structure in your PostgreSQL database...');
    const client = await pool.connect();
    
    // Check what tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables in database:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check users table structure
    const userColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Users table structure:');
    userColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if there are any existing users
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\n👥 Total users in database: ${userCount.rows[0].count}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

checkTableStructure();
