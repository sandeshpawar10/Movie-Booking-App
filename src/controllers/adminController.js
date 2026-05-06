const booking = require('../models/bookingModel');
const show = require('../models/showModel');
const user = require('../models/userModel');
const theatre = require('../models/theatreModel');

exports.getAnalytics = async (req, res) => {
    try {
        const totalBookings = await booking.countDocuments({ bookingStatus: { $ne: 'cancelled' } });
        
        const allBookings = await booking.find({ bookingStatus: { $ne: 'cancelled' } });
        const totalRevenue = allBookings.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        
        const totalUsers = await user.countDocuments();
        const activeTheatres = await theatre.countDocuments({ isActive: true, isApproved: true });

        // Cancellation reason breakdown
        const cancelledBookings = await booking.find({ bookingStatus: 'cancelled', cancellationReason: { $ne: null } });
        const cancellationReasons = {};
        cancelledBookings.forEach(b => {
            const reason = b.cancellationReason || 'Other';
            cancellationReasons[reason] = (cancellationReasons[reason] || 0) + 1;
        });
        const totalCancelled = await booking.countDocuments({ bookingStatus: 'cancelled' });
        
        return res.status(200).json({
            data: {
                totalBookings,
                totalRevenue,
                totalUsers,
                activeTheatres,
                totalCancelled,
                cancellationReasons
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};
