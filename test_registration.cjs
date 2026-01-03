const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_user:3hHx4ds9FeT4E7SNGr3w9rcPplymI1Ce@dpg-d31suqndiees7388j8s0-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a',
  ssl: { rejectUnauthorized: false }
});

async function testRegistration() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    
    // Test if we can see the users table
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table structure:');
    tableCheck.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Test inserting a user
    const userData = {
      firstName: 'Test',
      lastName: 'User', 
      email: 'test@example.com',
      password: 'password123',
      phone: '+1234567890',
      country: 'United States',
      plan_type: 'premium'
    };
    
    console.log('Testing user insertion...');
    const result = await client.query(`
      INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        password_hash, 
        phone, 
        company, 
        country, 
        agree_to_marketing, 
        plan_type, 
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, first_name, last_name, email, phone, company, country, plan_type, created_at
    `, [
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.password, 
      userData.phone || null,
      null, // company
      userData.country || null,
      false, // agreeToMarketing
      userData.plan_type || 'premium'
    ]);
    
    console.log('✅ User inserted successfully:');
    console.log(result.rows[0]);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

testRegistration();
