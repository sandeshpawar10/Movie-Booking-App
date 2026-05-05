const cron = require('node-cron');
const booking = require('../models/bookingModel');
const show = require('../models/showModel');
const sendEmail = require('../utils/mailer');

// Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
    try {
        console.log('[CRON] Running show reminder job...');
        
        // Find time exactly 3 hours from now
        const now = new Date();
        const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        
        // Find shows starting in the next 3 to 3.5 hours
        const thirtyMinsLater = new Date(threeHoursLater.getTime() + 30 * 60 * 1000);
        
        const upcomingShows = await show.find({
            startTime: { $gte: threeHoursLater, $lt: thirtyMinsLater }
        }).populate('movieId theatreId');

        if (upcomingShows.length === 0) {
            console.log('[CRON] No upcoming shows in the 3-hour window.');
            return;
        }

        console.log(`[CRON] Found ${upcomingShows.length} shows starting soon.`);

        for (const s of upcomingShows) {
            // Find bookings for this show that haven't had a reminder sent
            const bookings = await booking.find({ 
                show: s._id,
                reminderSent: { $ne: true }
            }).populate('user');

            for (const b of bookings) {
                if (!b.user || !b.user.email) continue;
                
                const movieTitle = s.movieId ? s.movieId.title : 'Movie';
                const theatreName = s.theatreId ? s.theatreId.name : 'Theatre';
                const showTime = new Date(s.startTime).toLocaleString();

                sendEmail(
                    b.user.email,
                    `Reminder: ${movieTitle} starts in 3 hours!`,
                    `Hello ${b.user.username},\n\nThis is a friendly reminder that your booking for ${movieTitle} at ${theatreName} starts at ${showTime}.\n\nPlease arrive 15 minutes early.\n\nEnjoy the movie!`
                );

                // Mark as sent
                b.reminderSent = true;
                await b.save();
            }
        }
    } catch (err) {
        console.error('[CRON] Error in reminder job:', err);
    }
});

console.log('Show reminder cron job initialized.');
