const notificationsService = require("../services/notificationsService");

exports.getNotifications = async (req, res) => {
    try {
        const { organisationId } = req.params;
        const { limit, page } = req.query;
        if (!organisationId) {
            return res.status(400).json({
                status: 400,
                message: "organisationId is required"
            });
        }

        const notifications = await notificationsService.getNotifications(organisationId, limit, page);

        return res.status(200).json({
            status: 200,
            message: "Notifications retrieved successfully",
            data: notifications
        });

    } catch (error) {
        console.error("Error fetching notifications:", error.message);
        return res.status(500).json({
            status: 500,
            message: "Error retrieving notifications",
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        if (!notificationId) {
            return res.status(400).json({
                status: 400,
                message: "notificationId is required"
            });
        }
        const result = await notificationsService.markAsRead(notificationId);

        if (result.status === 200) {
            return res.status(200).json(result);
        } else {
            return res.status(500).json(result);
        }

    } catch (error) {
        console.error("Error updating notification status:", error.message);
        return res.status(500).json({
            status: 500,
            message: "Error updating notification status",
        });
    }
};
