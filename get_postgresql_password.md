# How to Get Your PostgreSQL Password from Render

## Step 1: Get the Password from Render Dashboard

1. Go to your Render dashboard: https://dashboard.render.com
2. Find your PostgreSQL database service
3. Click on it to open the details
4. Look for "Connection" or "Database" section
5. Copy the password (it should be a long string of characters)

## Step 2: Set the Password as Environment Variable

### Option A: Set for current session
```bash
export POSTGRES_PASSWORD=your_actual_password_here
```

### Option B: Set when running the backend
```bash
POSTGRES_PASSWORD=your_actual_password_here python3 working_backend_with_postgresql.py
```

## Step 3: Test the Connection

```bash
python3 test_postgresql_connection.py
```

## Step 4: Start the Backend

```bash
python3 start_postgresql_backend.py
```

## Alternative: Direct Connection Test

If you want to test the connection directly, you can also run:

```bash
psql "postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_cdm2:YOUR_PASSWORD@dpg-d37pd8nfte5s73bfl1ug-a:5432/pghero_dpg_d2v9i7er433s73f0878g_a_cdm2"
```

Replace `YOUR_PASSWORD` with your actual password from Render.
