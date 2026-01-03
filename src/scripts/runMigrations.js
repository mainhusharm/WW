const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user:f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V@dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
  ssl: {
    rejectUnauthorized: false
  }
};

async function runMigrations() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Read migration files
    const migrationsDir = path.join(__dirname, '../../database_migrations');
    const migrationFiles = [
      'user_data_schema.sql',
      'signal_meta_schema.sql'
    ];
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      
      if (fs.existsSync(filePath)) {
        console.log(`📄 Running migration: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        await pool.query(sql);
        console.log(`✅ Migration completed: ${file}`);
      } else {
        console.log(`⚠️  Migration file not found: ${file}`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
    // Test the connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('🔗 Database connection test:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
