# Customer Service Dashboard

A modern, responsive customer service dashboard built with Flask backend and HTML/CSS/JavaScript frontend.

## Features

- **Customer Management**: View, search, and manage customer information
- **Activity Tracking**: Monitor customer activities and interactions
- **Screenshot Management**: Store and view customer screenshots
- **Questionnaire Responses**: Track customer questionnaire responses
- **Risk Management Plans**: Store customer risk management strategies
- **Dashboard Data**: Store and display customer-specific dashboard data
- **Modern UI**: Beautiful, responsive interface with dark theme

## Quick Start

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Clone or navigate to the customer-service directory**
   ```bash
   cd customer-service
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the service**
   ```bash
   ./start_service.sh
   ```
   
   Or manually:
   ```bash
   python3 api.py
   ```

4. **Access the dashboard**
   - Open your browser and go to: `http://localhost:3005`
   - The API will be available at: `http://localhost:3005/api/`

## API Endpoints

### Health Check
- `GET /health` - Check API health and database status

### Customers
- `GET /api/customers` - Get all customers (with pagination)
- `GET /api/customers/search?search=<term>` - Search customers
- `GET /api/customers/<customer_id>` - Get customer details
- `POST /api/customers` - Create new customer
- `DELETE /api/customers/<customer_id>` - Delete customer

### Customer Data
- `POST /api/customers/<customer_id>/activities` - Add activity
- `POST /api/customers/<customer_id>/screenshots` - Add screenshot
- `POST /api/customers/<customer_id>/questionnaire` - Add questionnaire response
- `POST /api/customers/<customer_id>/risk-plan` - Add risk management plan
- `POST /api/customers/<customer_id>/dashboard-data` - Add dashboard data

## Database Schema

The service uses SQLite with the following tables:

- **customers**: Basic customer information
- **customer_activities**: Customer activity logs
- **customer_screenshots**: Stored screenshots
- **questionnaire_responses**: Customer questionnaire responses
- **risk_management_plans**: Risk management strategies
- **dashboard_data**: Customer-specific dashboard data

## Sample Data

The service automatically creates sample data on first run:
- 5 sample customers with different membership tiers
- Sample activities, screenshots, and questionnaire responses
- This allows you to immediately test the dashboard functionality

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in `api.py` (line 569)
   - Or kill the process using the port

2. **Database errors**
   - Delete `customer_service.db` and restart
   - Check file permissions in the customer-service directory

3. **Import errors**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check Python version compatibility

### Testing the API

Use the included test script:
```bash
python3 test_api.py
```

This will test all major endpoints and verify the service is working correctly.

## Development

### Adding New Features

1. **Backend**: Add new routes in `api.py`
2. **Frontend**: Update `index.html` with new UI elements
3. **Database**: Add new tables in `init_database()` function

### Customization

- **Styling**: Modify CSS variables in the `:root` section
- **Fields**: Add new customer fields in the database schema
- **Validation**: Add input validation in the API endpoints

## Security Notes

- The service includes basic error handling
- Input validation is implemented for all endpoints
- Consider adding authentication for production use
- Database file should be secured in production environments

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Check the console for error messages
4. Test individual API endpoints for specific issues
