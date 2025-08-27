# Import the application from wsgi.py
from wsgi import application
import os

# This file exists for compatibility with Render
# The actual application is defined in wsgi.py

# Export both 'app' and 'application' for maximum compatibility
app = application

# Debug: Print environment variables and app configuration
print(f"App.py: Environment variables:")
print(f"  FLASK_ENV: {os.environ.get('FLASK_ENV', 'Not set')}")
print(f"  PYTHON_VERSION: {os.environ.get('PYTHON_VERSION', 'Not set')}")
print(f"  PORT: {os.environ.get('PORT', 'Not set')}")
print(f"  PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not set')}")

# Debug: Print the app type and available attributes
print(f"App.py: WSGI Application imported successfully: {type(application)}")
print(f"App.py: Application name: {application.name}")
print(f"App.py: Application config: {application.config.get('ENV', 'Not set')}")
print(f"App.py: Application debug mode: {application.debug}")

# Ensure the application is callable
if callable(application):
    print("App.py: Application is callable and ready for Gunicorn")
else:
    print("App.py: ERROR - Application is not callable!")

# Add a simple test route to verify the app is working
@application.route('/app-test')
def app_test():
    return {'message': 'App.py is working correctly!', 'status': 'success'}

# Also add the test route to the 'app' variable
@app.route('/app-test-2')
def app_test_2():
    return {'message': 'App.py app variable is working correctly!', 'status': 'success'}
