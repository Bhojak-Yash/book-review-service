module.exports = (sequelize, Sequelize) => {
    const address = sequelize.define("address", {
        "addressId": {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        "userId":{
            type:Sequelize.BIGINT,
            allowNull:false
        },
        "addressType": {
            type: Sequelize.ENUM("Business", "Billing"),
            allowNull: false
        },
        "name": {
            type: Sequelize.STRING
        },
        "mobile": {
            type: Sequelize.BIGINT
        },
        "email": {
            type: Sequelize.STRING
        },
        "webURL": {
            type: Sequelize.STRING
        },
        "addLine1": {
            type: Sequelize.STRING
        },
        "addLine2": {
            type: Sequelize.STRING
        },
        "city": {
            type: Sequelize.STRING
        },
        "state": {
            type: Sequelize.STRING
        },
        "country":{
            type:Sequelize.STRING
        },
        "pinCode": {
            type: Sequelize.BIGINT
        }
    },

        {
            tableName: "address",
        })
    return address
}