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
        }
    },

    {
        tableName: "payments"
      })
    return payments
}
