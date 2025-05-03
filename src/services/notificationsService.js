const message = require('../helpers/message');
const db = require('../models/db');
const { Op } = require('sequelize');

exports.createNotification = async (notificationData) => {
    // console.log("Calling createNotification with:", notificationData);  // Debugging

    try {
        const newNotification = await db.notifications.create({
            organisationId: notificationData.organisationId,
            category: notificationData.category,
            title: notificationData.title,
            status: notificationData.status || 'Unread',
            description: notificationData.description,
        });

        // console.log("Inserted Notification:", newNotification.dataValues);  // Debugging

        return {
            status: 200,
            message: "Notification created successfully",
            data: newNotification,
        };
    } catch (error) {
        console.error("createNotification Error:", error.message);

        return {
            status: 500,
            message: "Error creating notification",
            error: error.message
        };
    }
};

exports.updateNotificationStatus = async (notificationId, status) => {
    try {
        const updatedNotification = await db.notifications.update(
            { status: status },
            { where: { id: notificationId }, returning: true }
        );

        if (updatedNotification[0] === 0) {
            return {
                status: 404,
                message: "Notification not found",
            };
        }

        return {
            status: 200,
            message: "Notification status updated successfully",
            data: updatedNotification,
        };
    } catch (error) {
        console.error("updateNotificationStatus Error:", error.message);

        return {
            status: 500,
            message: "Error updating notification status",
            error: error.message,
        };
    }
};

exports.getNotifications = async (organisationId) => {
    try {
        const notifications = await db.notifications.findAll({
            where: { organisationId: organisationId },
            order: [['createdAt', 'DESC']] // Latest notifications first
        });

        return notifications;
    } catch (error) {
        console.error("getNotificationsByOrganisation error:", error.message);
        throw new Error("Error fetching notifications");
    }
};

exports.markAsRead = async (notificationId) => {
    try {
        const notification = await db.notifications.findByPk(notificationId);

        if (!notification) {
            return {
                status: 404,
                message: "Notification not found"
            };
        }

        await db.notifications.update(
            { status: "Read" },
            { where: { id: notificationId } }
        );

        return {
            status: 200,
            message: "Notification marked as read successfully"
        };
    } catch (error) {
        console.error("markNotificationAsRead error:", error.message);
        return {
            status: 500,
            message: "Error updating notification status"
        };
    }
};
