# Email Normalization and One Email - One Account Implementation

## Overview

This implementation ensures that only one account can exist per email address by implementing comprehensive email normalization. It prevents users from creating multiple accounts using Gmail aliases (dots and plus signs) or case variations.

## Features

✅ **Email Normalization**: Automatically normalizes email addresses to prevent duplicates
✅ **Gmail Dot Removal**: Removes dots from Gmail addresses (e.g., `t.e.s.t@gmail.com` → `test@gmail.com`)
✅ **Gmail Plus Alias Removal**: Removes everything after + in Gmail addresses (e.g., `test+alias@gmail.com` → `test@gmail.com`)
✅ **Case Normalization**: Converts all emails to lowercase
✅ **Whitespace Trimming**: Removes leading/trailing whitespace
✅ **Duplicate Prevention**: Blocks registration attempts with duplicate normalized emails
✅ **Database Constraints**: Enforces uniqueness at the database level

## How It Works

### 1. Email Normalization Process

The system normalizes emails using the following rules:

- **All emails**: Convert to lowercase and trim whitespace
- **Gmail addresses**: Remove dots and everything after + signs
- **Other domains**: Preserve original format (only case and whitespace normalization)

### 2. Examples

| Original Email | Normalized Email | Status |
|----------------|------------------|---------|
| `Test@Gmail.com` | `test@gmail.com` | ✅ Normalized |
| `t.e.s.t@gmail.com` | `test@gmail.com` | ✅ Dots removed |
| `test+alias@gmail.com` | `test@gmail.com` | ✅ Plus alias removed |
| `Test@Yahoo.com` | `test@yahoo.com` | ✅ Case normalized only |
| `t.e.s.t@yahoo.com` | `t.e.s.t@yahoo.com` | ✅ Dots preserved (non-Gmail) |

### 3. Duplicate Detection

The system checks for duplicates using both:
- **Normalized email**: Prevents Gmail alias abuse
- **Original email**: Additional safety check

## Implementation Details

### Database Schema Changes

```sql
-- Added normalized_email column to users table
ALTER TABLE users ADD COLUMN normalized_email TEXT;

-- Created unique constraint
ALTER TABLE users ADD CONSTRAINT unique_normalized_email UNIQUE(normalized_email);

-- Added index for performance
CREATE INDEX idx_users_normalized_email ON users(normalized_email);
```

### User Model Updates

```python
class User(db.Model):
    # ... existing fields ...
    normalized_email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    
    def __init__(self, **kwargs):
        # ... existing logic ...
        if self.email and not self.normalized_email:
            self.normalized_email = self.normalize_email(self.email)
    
    @staticmethod
    def normalize_email(email):
        # Implementation of email normalization logic
        pass
```

### Authentication System Updates

```python
@auth_bp.route('/register', methods=['POST'])
def register():
    # ... validation logic ...
    
    # Check for existing user by normalized email
    normalized_email = User.normalize_email(email)
    existing_user = User.query.filter_by(normalized_email=normalized_email).first()
    
    if existing_user:
        return jsonify({"msg": "An account with this email already exists"}), 409
    
    # ... create user logic ...
```

## Files Modified

1. **`journal/models.py`**
   - Added `normalized_email` field to User model
   - Added `normalize_email` static method
   - Auto-normalization in `__init__` method

2. **`journal/auth.py`**
   - Updated registration logic to use normalized emails
   - Enhanced duplicate detection
   - Added comprehensive error handling

3. **`implement_email_normalization.py`**
   - Main implementation script
   - Database schema updates
   - Model and auth system updates

4. **`migrate_email_normalization.py`**
   - Database migration script for existing users
   - Updates existing users with normalized emails

5. **`test_email_normalization.py`**
   - Comprehensive test suite
   - Validates normalization logic
   - Tests duplicate detection

## Installation and Setup

### Step 1: Run the Implementation Script

```bash
python implement_email_normalization.py
```

This script will:
- Update the database schema
- Modify the User model
- Update the authentication system
- Create migration scripts

### Step 2: Run the Migration

```bash
python migrate_email_normalization.py
```

This will update existing users with normalized emails.

### Step 3: Test the Implementation

```bash
python test_email_normalization.py
```

Verify that all tests pass.

## Testing

### Manual Testing

1. **Test Gmail Dot Removal**:
   - Try to register with `test@gmail.com`
   - Try to register with `t.e.s.t@gmail.com`
   - Second attempt should be blocked

2. **Test Gmail Plus Aliases**:
   - Try to register with `test@gmail.com`
   - Try to register with `test+alias@gmail.com`
   - Second attempt should be blocked

3. **Test Case Variations**:
   - Try to register with `Test@Gmail.com`
   - Try to register with `test@gmail.com`
   - Second attempt should be blocked

4. **Test Non-Gmail Domains**:
   - Try to register with `test@yahoo.com`
   - Try to register with `t.e.s.t@yahoo.com`
   - Both should work (dots are preserved for non-Gmail)

### Automated Testing

The test suite covers:
- Basic email normalization
- Gmail-specific normalization
- Duplicate detection
- Edge cases and error handling

## Security Considerations

1. **No Data Loss**: Original email addresses are preserved
2. **Backward Compatibility**: Existing functionality remains unchanged
3. **Database Constraints**: Uniqueness enforced at database level
4. **Comprehensive Validation**: Multiple layers of duplicate checking

## Performance Impact

- **Minimal**: Email normalization is a simple string operation
- **Indexed**: `normalized_email` field is indexed for fast lookups
- **Efficient**: Single database query for duplicate detection

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure you're running scripts from the project root
2. **Database Connection**: Verify database file exists and is accessible
3. **Permission Issues**: Check file permissions for database and log files

### Debug Mode

Enable debug logging in the auth system to see detailed normalization steps:

```python
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

1. **Additional Email Providers**: Support for other providers with similar alias systems
2. **Custom Normalization Rules**: Configurable normalization rules per domain
3. **Email Verification**: Enhanced email verification with normalization
4. **Audit Logging**: Track email normalization changes for compliance

## Support

If you encounter any issues:

1. Check the test results: `python test_email_normalization.py`
2. Review the logs for error messages
3. Verify database schema changes were applied
4. Test with a simple email registration

## Conclusion

This implementation provides a robust, secure, and efficient solution for ensuring one email - one account restriction. It handles Gmail aliases correctly while maintaining compatibility with other email providers and preserving existing functionality.
