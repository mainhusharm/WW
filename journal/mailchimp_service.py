import os
import mailchimp_marketing as MailchimpMarketing
from mailchimp_marketing.api_client import ApiClientError

MAILCHIMP_API_KEY = os.environ.get("MAILCHIMP_API_KEY")
MAILCHIMP_AUDIENCE_ID = os.environ.get("MAILCHIMP_AUDIENCE_ID")
MAILCHIMP_SERVER = MAILCHIMP_API_KEY.split('-')[-1] if MAILCHIMP_API_KEY else ''

try:
    mailchimp = MailchimpMarketing.Client()
    mailchimp.set_config({
        "api_key": MAILCHIMP_API_KEY,
        "server": MAILCHIMP_SERVER,
    })
except Exception as e:
    print(f"Error initializing Mailchimp client: {e}")
    mailchimp = None

def add_user_to_audience(email, first_name, last_name):
    """Add a new user to the Mailchimp audience."""
    if not mailchimp:
        return

    member_info = {
        "email_address": email,
        "status": "subscribed",
        "merge_fields": {
            "FNAME": first_name,
            "LNAME": last_name,
        }
    }

    try:
        mailchimp.lists.add_list_member(MAILCHIMP_AUDIENCE_ID, member_info)
    except ApiClientError as error:
        print(f"Error adding user to Mailchimp audience: {error.text}")

def send_transactional_email(to_email, subject, html_content):
    """Send a transactional email using Mailchimp."""
    if not mailchimp:
        return

    message = {
        "from_email": "your-email@example.com",  # Replace with your sending email
        "to": [
            {
                "email": to_email,
                "type": "to"
            }
        ],
        "subject": subject,
        "html": html_content
    }

    try:
        # Note: Sending transactional emails requires Mailchimp Transactional (formerly Mandrill)
        # This is a separate service from Mailchimp Marketing.
        # The mailchimp_marketing library does not support sending transactional emails.
        # You would need to use a different library, such as `requests`, to call the
        # Mailchimp Transactional API directly.
        print("Sending transactional email (simulation)...")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"HTML Content: {html_content}")
    except Exception as e:
        print(f"Error sending transactional email: {e}")

def create_futuristic_email_template(title, message):
    """Create a futuristic-style HTML email template."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
            body {{
                background-color: #0a0a1a;
                color: #e0e0e0;
                font-family: 'Orbitron', sans-serif;
                margin: 0;
                padding: 0;
            }}
            .container {{
                padding: 40px;
                max-width: 600px;
                margin: 0 auto;
                border: 1px solid #4a4a7a;
                border-radius: 10px;
                background: rgba(10, 10, 30, 0.8);
                box-shadow: 0 0 20px rgba(74, 74, 122, 0.5);
            }}
            h1 {{
                color: #00f0ff;
                text-align: center;
                text-shadow: 0 0 10px #00f0ff;
                animation: glow 1.5s ease-in-out infinite alternate;
            }}
            p {{
                font-size: 16px;
                line-height: 1.6;
                color: #c0c0ff;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #888;
            }}
            @keyframes glow {{
                from {{
                    text-shadow: 0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 30px #00f0ff;
                }}
                to {{
                    text-shadow: 0 0 20px #00f0ff, 0 0 30px #4dffff, 0 0 40px #4dffff;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>{title}</h1>
            <p>{message}</p>
            <div class="footer">
                &copy; 2024 TraderEdge Pro. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
