module.exports = (sequelize, Sequelize) => {
    const modulemappings = sequelize.define("modulemappings", {
        "moduleMappingId": {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        "moduleConfigId": {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "roleId": {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "accessLevel": {
            type: Sequelize.ENUM('Full', 'Read','None'),
            allowNull: false
        }
    },
        {
            tableName: "modulemappings"
        })
    return modulemappings
}