# Import the application from wsgi.py
from wsgi import application

# This file exists for compatibility with Render
# The actual application is defined in wsgi.py

# Debug: Print the app type and available attributes
print(f"App.py: WSGI Application imported successfully: {type(application)}")
print(f"App.py: Application name: {application.name}")
print(f"App.py: Application config: {application.config.get('ENV', 'Not set')}")

# Ensure the application is callable
if callable(application):
    print("App.py: Application is callable and ready for Gunicorn")
else:
    print("App.py: ERROR - Application is not callable!")

# Add a simple test route to verify the app is working
@application.route('/app-test')
def app_test():
    return {'message': 'App.py is working correctly!', 'status': 'success'}
