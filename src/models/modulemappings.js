module.exports = (sequelize, Sequelize) => {
    const modulemappings = sequelize.define("modulemappings", {
        "moduleMappingId": {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        "moduleConfigId": {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "userId": {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "accessLevel": {
            type: Sequelize.ENUM('Full', 'Read','None'),
            allowNull: false
        },
        "status": {
            type: Sequelize.STRING
        }
    },
        {
            tableName: "modulemappings"
        })
    return modulemappings
}