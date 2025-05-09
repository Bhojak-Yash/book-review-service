module.exports = (sequelize, Sequelize) => {
    const HSN_code = sequelize.define("HSN_code", {
        "id": {
            type: Sequelize.INTEGER,
            primaryKey: true, 
            autoIncrement: true, 
            allowNull: false
        },
        "HSN_CD": {
            type: Sequelize.STRING,
            allowNull: false
        },
        "HSN_Description": {
            type: Sequelize.STRING
        },
        "CGST": {
            type: Sequelize.INTEGER
        },
        "SGST": {
            type: Sequelize.INTEGER
        },
        "IGST": {
            type: Sequelize.INTEGER
        },
        "category": {
            type: Sequelize.STRING,
        }
    },

        {
            tableName: "HSN_code",
            timestamps: true,
            // paranoid: true
        })
    return HSN_code
}

