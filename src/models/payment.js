module.exports =(sequelize,Sequelize)=>{
    const payments = sequelize.define("payments",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "orderId":{
            type:Sequelize.INTEGER
        },
        "amount":{
            type:Sequelize.BIGINT
        },
        "mode":{
            type:Sequelize.STRING
        },
        "image":{
            type:Sequelize.STRING
        },
        "status":{
            type:Sequelize.ENUM('Pending','Confirmed')
        }
    },

    {
        tableName: "payments"
      })
    return payments
}
