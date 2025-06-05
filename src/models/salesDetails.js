module.exports =(sequelize,Sequelize)=>{
    const SalesDetails = sequelize.define("sales_details",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "headerId":{
            type:Sequelize.BIGINT
        },
        "PId":{
            type:Sequelize.BIGINT
        },
        "SId":{
            type:Sequelize.BIGINT
        },
        "qty":{
            type:Sequelize.INTEGER
        },
        "MRP":{
            type:Sequelize.DECIMAL
        },
        "rate":{
            type: Sequelize.DECIMAL
        },
        "SGST":{
            type:Sequelize.DECIMAL
        },
        "CGST":{
            type:Sequelize.DECIMAL
        },
        "IGST":{
            type:Sequelize.DECIMAL
        },
        "amount":{
            type:Sequelize.DECIMAL
        },
        "scheme":{
            type:Sequelize.STRING
        }
    },

    {
        tableName: "sales_details"
      })
    return SalesDetails
}
