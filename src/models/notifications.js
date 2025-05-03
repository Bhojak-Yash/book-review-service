module.exports = (sequelize, Sequelize) => {
    const notifications = sequelize.define("notifications", {  // Correct model name
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        organisationId: {
            type: Sequelize.INTEGER,
            allowNull: false  // Ensure it's not null if required
        },
        category: {
            type: Sequelize.STRING,
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.STRING,
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('Read', 'Unread'),
            defaultValue: 'Unread' 
        }
    }, {
        tableName: "notifications",
        timestamps: true,  
    });

    return notifications;
};
