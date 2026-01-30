"""
Bid Reminder Scheduler for GEM BID CRM
Automatically checks for bids ending tomorrow and sends email reminders
"""

import logging
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from email_service import send_bid_reminder_email, format_date_for_display

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None
db = None


def init_scheduler(database):
    """
    Initialize the scheduler with database connection
    
    Args:
        database: MongoDB database instance
    """
    global scheduler, db
    db = database
    
    scheduler = AsyncIOScheduler()
    
    # Schedule daily check at 9:00 AM IST (03:30 UTC)
    scheduler.add_job(
        check_and_send_reminders,
        CronTrigger(hour=3, minute=30),  # 9:00 AM IST
        id='bid_reminder_check',
        name='Check bids ending tomorrow and send reminders',
        replace_existing=True
    )
    
    # Also run once at startup for testing (optional, can be removed in production)
    scheduler.add_job(
        check_and_send_reminders,
        'date',
        run_date=datetime.now(timezone.utc) + timedelta(seconds=30),
        id='startup_check',
        name='Initial bid reminder check on startup'
    )
    
    scheduler.start()
    logger.info("✅ Bid reminder scheduler initialized and started")
    logger.info("📅 Daily reminder check scheduled for 9:00 AM IST")


async def check_and_send_reminders():
    """
    Check for bids ending tomorrow and send email reminders
    This function runs daily via the scheduler
    """
    try:
        logger.info("🔍 Starting daily bid reminder check...")
        
        # Calculate tomorrow's date
        today = datetime.now(timezone.utc).date()
        tomorrow = today + timedelta(days=1)
        tomorrow_str = tomorrow.isoformat()
        
        logger.info(f"📆 Checking for bids ending on: {tomorrow_str}")
        
        # Query bids ending tomorrow
        # We need to check if the bid's end_date matches tomorrow
        # and if we haven't already sent a reminder for this bid
        
        query = {
            "end_date": {
                "$gte": tomorrow_str,
                "$lt": (tomorrow + timedelta(days=1)).isoformat()
            }
        }
        
        bids = await db.gem_bids.find(query, {"_id": 0}).to_list(1000)
        
        if not bids:
            logger.info("✅ No bids ending tomorrow. No reminders to send.")
            return
        
        logger.info(f"📧 Found {len(bids)} bid(s) ending tomorrow")
        
        # Track reminders sent
        reminders_sent = 0
        reminders_failed = 0
        reminders_skipped = 0
        
        for bid in bids:
            bid_id = bid.get("id")
            gem_bid_no = bid.get("gem_bid_no", "N/A")
            bid_details = bid.get("Bid_details") or bid.get("description") or "No details available"
            end_date = bid.get("end_date", "N/A")
            
            # Check if reminder already sent for this bid
            reminder_sent = bid.get("reminder_sent", False)
            
            if reminder_sent:
                logger.info(f"⏭️  Skipping {gem_bid_no} - reminder already sent")
                reminders_skipped += 1
                continue
            
            # Format date for display
            formatted_date = format_date_for_display(end_date)
            
            # Send email reminder
            logger.info(f"📤 Sending reminder for bid: {gem_bid_no}")
            success = await send_bid_reminder_email(
                gem_bid_no=gem_bid_no,
                bid_details=bid_details,
                end_date=formatted_date
            )
            
            if success:
                # Mark reminder as sent in database
                await db.gem_bids.update_one(
                    {"id": bid_id},
                    {"$set": {"reminder_sent": True, "reminder_sent_at": datetime.now(timezone.utc).isoformat()}}
                )
                reminders_sent += 1
                logger.info(f"✅ Reminder sent and marked for bid: {gem_bid_no}")
            else:
                reminders_failed += 1
                logger.warning(f"⚠️  Failed to send reminder for bid: {gem_bid_no}")
        
        # Summary log
        logger.info("=" * 60)
        logger.info("📊 Bid Reminder Check Summary:")
        logger.info(f"   Total bids ending tomorrow: {len(bids)}")
        logger.info(f"   ✅ Reminders sent: {reminders_sent}")
        logger.info(f"   ⏭️  Reminders skipped (already sent): {reminders_skipped}")
        logger.info(f"   ❌ Reminders failed: {reminders_failed}")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"❌ Error in bid reminder check: {str(e)}", exc_info=True)


def shutdown_scheduler():
    """
    Shutdown the scheduler gracefully
    """
    global scheduler
    if scheduler:
        scheduler.shutdown()
        logger.info("🛑 Bid reminder scheduler stopped")


def get_scheduler_status():
    """
    Get current scheduler status and next run time
    
    Returns:
        dict: Scheduler status information
    """
    global scheduler
    if not scheduler:
        return {"status": "not_initialized"}
    
    jobs = scheduler.get_jobs()
    job_info = []
    
    for job in jobs:
        job_info.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None
        })
    
    return {
        "status": "running" if scheduler.running else "stopped",
        "jobs": job_info
    }
