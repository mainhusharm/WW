# 📋 Questionnaire Integration Setup Complete

## ✅ **What We've Done:**

1. **✅ Created Supabase integration** for questionnaire data
2. **✅ Updated Questionnaire component** to save data with screenshots
3. **✅ Added image upload functionality** with base64 encoding
4. **✅ Added API functions** for questionnaire operations
5. **✅ Included email and user ID** from signup data

## 🔧 **Step 1: Create Questionnaire Details Table**

**In your Supabase SQL editor**, run this SQL:

```sql
-- Create questionnaire details table
CREATE TABLE "questionnaire details" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  -- Trading preferences
  trades_per_day TEXT NOT NULL,
  trading_session TEXT NOT NULL,
  crypto_assets TEXT[] DEFAULT '{}',
  forex_assets TEXT[] DEFAULT '{}',
  custom_forex_pairs TEXT[] DEFAULT '{}',
  
  -- Account information
  has_account TEXT NOT NULL CHECK (has_account IN ('yes', 'no')),
  account_equity DECIMAL(10,2),
  prop_firm TEXT,
  account_type TEXT,
  account_size DECIMAL(10,2),
  
  -- Risk management
  risk_percentage DECIMAL(3,1) NOT NULL,
  risk_reward_ratio TEXT NOT NULL,
  
  -- Screenshot upload
  account_screenshot TEXT, -- Base64 encoded image
  screenshot_filename TEXT,
  screenshot_size INTEGER,
  screenshot_type TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for now
ALTER TABLE "questionnaire details" DISABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_questionnaire_user_id ON "questionnaire details" (user_id);
CREATE INDEX idx_questionnaire_user_email ON "questionnaire details" (user_email);
```

**Click "Run"** in Supabase.

## 🔧 **Step 2: Test the Integration**

After creating the table, run this test:

```bash
node test-questionnaire-integration.js
```

## 📊 **What Will Be Saved:**

- ✅ **User Info**: Email, name, and ID from signup
- ✅ **Trading Preferences**: Trades per day, session, assets
- ✅ **Account Details**: Has account, equity, prop firm, type, size
- ✅ **Risk Management**: Risk percentage, risk/reward ratio
- ✅ **Screenshot**: Base64 encoded image with metadata
- ✅ **Custom Pairs**: Any custom forex pairs added

## 🖼️ **Image Upload Features:**

- ✅ **File Upload**: Users can upload account screenshots
- ✅ **Base64 Encoding**: Images stored as base64 in database
- ✅ **Metadata**: Filename, size, and type stored
- ✅ **Preview**: Users see image preview before submitting
- ✅ **Validation**: Required field with clear requirements

## 🎯 **How It Works:**

When someone completes the questionnaire:
1. **Form validates** all required fields including screenshot
2. **User submits** questionnaire with image
3. **Image converts** to base64 for database storage
4. **Data saves** to Supabase "questionnaire details" table
5. **User continues** to next step (normal flow)

## 🚀 **Ready to Go!**

Once you create the table, your questionnaire page will automatically save all data with screenshots to your Supabase "questionnaire details" table!

**Create the table and test it out!** 🎉
