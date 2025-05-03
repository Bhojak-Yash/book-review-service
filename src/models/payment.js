module.exports =(sequelize,Sequelize)=>{
    const payments = sequelize.define("payments",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "orderId":{
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "amount":{
            type: Sequelize.BIGINT,
            allowNull: false
        },
        "mode":{
            type:Sequelize.STRING
        },
        "image":{
            type:Sequelize.STRING
        },
        "status":{
            type: Sequelize.ENUM('Pending', 'Confirmed'),
            allowNull: false
        }
    },

    {
        tableName: "payments"
      })
    return payments
}
