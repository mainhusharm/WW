#!/usr/bin/env node
/**
 * Database Setup Script for TraderEdge Pro
 * This script sets up the PostgreSQL database with the required tables
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_user:3hHx4ds9FeT4E7SNGr3w9rcPplymI1Ce@dpg-d31suqndiees7388j8s0-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a',
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  let client;
  
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    client = await pool.connect();
    console.log('✅ Connected to database successfully');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'database_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Executing database schema...');
    await client.query(schema);
    console.log('✅ Database schema created successfully');

    // Test the setup by checking if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_progress', 'payments')
      ORDER BY table_name
    `);

    console.log('📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
