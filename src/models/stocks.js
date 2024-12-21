module.exports =(sequelize,Sequelize)=>{
    const stocks = sequelize.define("stocks",{
        "SId":{
            type:Sequelize.BIGINT,
            primaryKey: true, // Mark this as the primary key
            autoIncrement: true, // Optional: Automatically increment the ID
            allowNull: false
        },
        "PId":{
            type:Sequelize.INTEGER
        },
        "BatchNo":{
            type:Sequelize.STRING
        },
        "ExpDate":{
            type:Sequelize.DATE
        },
        "MRP":{
            type:Sequelize.DOUBLE
        },
        "PTR":{
            type:Sequelize.DOUBLE
        },
        "Scheme":{
            type:Sequelize.STRING
        },
        "BoxQty":{
            type:Sequelize.INTEGER
        },
        "Loose":{
            type:Sequelize.INTEGER
        },
        "Stock":{
            type:Sequelize.INTEGER
        },
        "manufacturerId":{
            type:Sequelize.BIGINT
        }
    },
    {
        tableName: "stocks"
      })
    return stocks
}