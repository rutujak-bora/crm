# GEM BID Email Reminder Feature

## Overview
Automatic email reminder system that sends notifications one day before GEM bids end.

## Features
✅ **Automatic Daily Checks** - Runs every day at 9:00 AM IST  
✅ **Smart Filtering** - Only sends reminders for bids ending tomorrow  
✅ **Duplicate Prevention** - Each bid gets only ONE reminder  
✅ **Professional Emails** - HTML formatted with bid details  
✅ **Comprehensive Logging** - Track all reminder activities  

## How It Works

### 1. Daily Schedule
- The system checks for expiring bids every day at **9:00 AM IST**
- Also runs once 30 seconds after server startup (for testing)

### 2. Reminder Logic
```
IF today = (End Date - 1 day):
  - Check if reminder already sent
  - If NOT sent:
    - Send email reminder
    - Mark as sent in database
  - If already sent:
    - Skip (no duplicate)
```

### 3. Email Content
**From:** yash.b@bora.tech  
**To:** yash.b@bora.tech  
**Subject:** This {Gem Bid No} has been end on {End Date}

**Body includes:**
- Gem Bid Number
- Bid Details
- End Date
- Professional HTML formatting

## Configuration

### Email Settings (.env file)
```env
# Email Configuration for Bid Reminders
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="yash.b@bora.tech"
SMTP_PASSWORD="your-app-specific-password-here"
EMAIL_FROM="yash.b@bora.tech"
EMAIL_TO="yash.b@bora.tech"
```

### Gmail Setup (Required for Production)
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate App-Specific Password:
   - Go to Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
4. Update `SMTP_PASSWORD` in `.env` file

## Database Changes

### New Fields Added to `gem_bids` Collection
- `reminder_sent` (boolean) - Tracks if reminder was sent
- `reminder_sent_at` (string) - ISO timestamp of when reminder was sent

These fields are automatically added when a reminder is sent.

## API Endpoints

### Check Scheduler Status
```http
GET /api/gem-bid/scheduler/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "running",
  "jobs": [
    {
      "id": "bid_reminder_check",
      "name": "Check bids ending tomorrow and send reminders",
      "next_run": "2026-01-31T03:30:00+00:00"
    }
  ]
}
```

## Files Added

### Backend Files
1. **`email_service.py`** - Email sending functionality
2. **`bid_reminder_scheduler.py`** - Scheduler and reminder logic
3. **Updated `server.py`** - Integration with main application

### Dependencies Added
- `APScheduler==3.10.4` - Background job scheduling
- `aiosmtplib==3.0.1` - Async email sending

## Testing

### Test Without Email Configuration
If `SMTP_PASSWORD` is not configured, the system will:
- Log a warning message
- Skip actual email sending
- Continue normal operation
- Log what would have been sent

### Test With Email Configuration
1. Configure Gmail app password in `.env`
2. Create a test bid with end_date = tomorrow
3. Wait for scheduled check OR restart server (runs after 30 seconds)
4. Check logs for confirmation
5. Check email inbox

### Manual Test
```python
# In Python console or test script
from bid_reminder_scheduler import check_and_send_reminders
import asyncio

# Run the reminder check manually
asyncio.run(check_and_send_reminders())
```

## Logs

### Successful Reminder
```
🔍 Starting daily bid reminder check...
📆 Checking for bids ending on: 2026-01-31
📧 Found 2 bid(s) ending tomorrow
📤 Sending reminder for bid: GEM/2026/001
✅ Email reminder sent successfully for bid: GEM/2026/001
✅ Reminder sent and marked for bid: GEM/2026/001
========================================================
📊 Bid Reminder Check Summary:
   Total bids ending tomorrow: 2
   ✅ Reminders sent: 2
   ⏭️  Reminders skipped (already sent): 0
   ❌ Reminders failed: 0
========================================================
```

### No Bids Ending
```
🔍 Starting daily bid reminder check...
📆 Checking for bids ending on: 2026-01-31
✅ No bids ending tomorrow. No reminders to send.
```

### Duplicate Prevention
```
🔍 Starting daily bid reminder check...
📆 Checking for bids ending on: 2026-01-31
📧 Found 1 bid(s) ending tomorrow
⏭️  Skipping GEM/2026/001 - reminder already sent
========================================================
📊 Bid Reminder Check Summary:
   Total bids ending tomorrow: 1
   ✅ Reminders sent: 0
   ⏭️  Reminders skipped (already sent): 1
   ❌ Reminders failed: 0
========================================================
```

## Troubleshooting

### Emails Not Sending
1. **Check SMTP Password**: Ensure app-specific password is configured
2. **Check Gmail Settings**: Verify 2FA is enabled
3. **Check Logs**: Look for error messages in server logs
4. **Test SMTP Connection**: Verify network allows SMTP on port 587

### Scheduler Not Running
1. **Check Startup Logs**: Look for "Bid reminder scheduler initialized"
2. **Check Status Endpoint**: Call `/api/gem-bid/scheduler/status`
3. **Restart Server**: Scheduler initializes on startup

### Wrong Time Zone
- Scheduler uses UTC internally
- Configured for 9:00 AM IST (03:30 UTC)
- Adjust in `bid_reminder_scheduler.py` if needed

## Production Deployment

### Checklist
- [ ] Configure Gmail app-specific password
- [ ] Update `EMAIL_FROM` and `EMAIL_TO` if needed
- [ ] Test with sample bid
- [ ] Monitor logs for first few days
- [ ] Set up email delivery monitoring

### Monitoring
- Check server logs daily
- Monitor email delivery rates
- Track failed reminders
- Review scheduler status regularly

## Security Notes

⚠️ **Important:**
- Never commit `.env` file with real passwords
- Use app-specific passwords, not main Gmail password
- Keep `SMTP_PASSWORD` secure
- Rotate passwords periodically

## Support

For issues or questions:
1. Check server logs first
2. Verify email configuration
3. Test scheduler status endpoint
4. Review this documentation

---

**Last Updated:** 2026-01-30  
**Version:** 1.0.0
