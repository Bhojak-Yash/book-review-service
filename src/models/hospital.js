module.exports = (sequelize, Sequelize) => {
    const hospital = sequelize.define("hospital", {
        "hospitalId": {
            type: Sequelize.INTEGER,
            primaryKey: true, 
            // autoIncrement: true,
            allowNull: false
        },
        "hospitalCode": {
            type: Sequelize.STRING,
        },
        "hospitalName": {
            type: Sequelize.STRING,
            allowNull: false
        },
    
        "type": {
            type: Sequelize.ENUM("Government", "Private", "Clinic", "Trust")
        },
        "phone": {
            type: Sequelize.BIGINT
        },
        "email": {
            type: Sequelize.STRING,
            allowNull: false
        },
        "address": {
            type: Sequelize.STRING
        },
        "city": {
            type: Sequelize.STRING
        },
        "state": {
            type: Sequelize.STRING
        },
        "pinCode": {
            type: Sequelize.BIGINT
        },
        "GST" : {
            type: Sequelize.STRING
        },
        "license" : {
            type: Sequelize.STRING
        },
        "status" : {
            type: Sequelize.ENUM(
                "Active",
                "Inactive"
            )
        },
    },

        {
            tableName: "hospital"
        })
    return hospital
}