"""
Email Service for GEM BID CRM
Handles sending automated email reminders for bids ending soon
"""

import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Email configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "yash.b@bora.tech")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "yash.b@bora.tech")
EMAIL_TO = os.getenv("EMAIL_TO", "yash.b@bora.tech")


async def send_bid_reminder_email(gem_bid_no: str, bid_details: str, end_date: str):
    """
    Send email reminder for a bid ending tomorrow
    
    Args:
        gem_bid_no: The GEM bid number
        bid_details: Details about the bid
        end_date: The end date of the bid
    """
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = EMAIL_FROM
        message["To"] = EMAIL_TO
        message["Subject"] = f"This {gem_bid_no} has been end on {end_date}"
        
        # Email body
        text_content = f"""
Please check this {gem_bid_no}.
The bid end date is on tomorrow {end_date}.

Bid Details:
- Bid Number: {gem_bid_no}
- Bid Details: {bid_details}
- End Date: {end_date}

This is an automated reminder from GEM BID CRM.
"""
        
        # HTML version for better formatting
        html_content = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">
        GEM BID Reminder
      </h2>
      
      <p style="font-size: 16px;">
        Please check this <strong>{gem_bid_no}</strong>.
      </p>
      
      <p style="font-size: 16px; color: #dc2626;">
        ⚠️ The bid end date is <strong>tomorrow {end_date}</strong>.
      </p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #059669;">Bid Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 5px 0;"><strong>Bid Number:</strong> {gem_bid_no}</li>
          <li style="padding: 5px 0;"><strong>Bid Details:</strong> {bid_details}</li>
          <li style="padding: 5px 0;"><strong>End Date:</strong> {end_date}</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        This is an automated reminder from GEM BID CRM.
      </p>
    </div>
  </body>
</html>
"""
        
        # Attach both text and HTML versions
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        message.attach(part1)
        message.attach(part2)
        
        # Send email
        if not SMTP_PASSWORD or SMTP_PASSWORD == "your-app-specific-password-here":
            logger.warning(f"SMTP password not configured. Email reminder for {gem_bid_no} not sent.")
            logger.info(f"Would have sent email reminder for bid {gem_bid_no} ending on {end_date}")
            return False
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        
        logger.info(f"✅ Email reminder sent successfully for bid {gem_bid_no}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email reminder for bid {gem_bid_no}: {str(e)}")
        return False


def format_date_for_display(date_str: str) -> str:
    """
    Format date string for display in email
    
    Args:
        date_str: Date string in ISO format or YYYY-MM-DD
        
    Returns:
        Formatted date string
    """
    try:
        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return date_obj.strftime("%B %d, %Y")
    except:
        return date_str
