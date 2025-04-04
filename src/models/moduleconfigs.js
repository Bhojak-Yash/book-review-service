module.exports = (sequelize, Sequelize) => {
    const moduleconfigs = sequelize.define("moduleconfigs", {
        "moduleConfigId": {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "moduleName": {
            type: Sequelize.STRING,
            allowNull: false
        },
        "moduleCode": {
            type: Sequelize.STRING,
            allowNull: false
        },
        "category": {
            type: Sequelize.ENUM('Manufacturer', 'Distributor', 'Retailer', 'Admin'),
            allowNull: false
        },
        "icon": {
            type: Sequelize.STRING
        },
        "url": {
            type: Sequelize.STRING
        },
        "menuType": {
            type: Sequelize.ENUM('Main', 'Sub', 'Component'),
            allowNull: false
        },
        "parentMenuId": {
            type: Sequelize.INTEGER
        }
    },
        {
            tableName: "moduleconfigs"
        })
    return moduleconfigs
}