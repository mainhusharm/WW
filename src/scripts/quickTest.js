const { Pool } = require('pg');

// Database configuration with your credentials
const dbConfig = {
  connectionString: "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2",
  ssl: {
    rejectUnauthorized: false
  }
};

async function quickTest() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔗 Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Connection successful!');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🗄️  Database version:', result.rows[0].db_version.split(' ')[0]);
    
    // Check if our tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Existing tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found - ready for migration!');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }
    
    console.log('\n🎉 Database is ready! You can now run:');
    console.log('   npm run db:migrate:env');
    console.log('   npm run db:test:env');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

quickTest();
