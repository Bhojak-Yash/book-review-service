module.exports =(sequelize,Sequelize)=>{
    const roles = sequelize.define("retailer_sales_details",{
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
            type:Sequelize.INTEGER
        },
        "rate":{
            type: Sequelize.INTEGER
        },
        "SGST":{
            type:Sequelize.DOUBLE
        },
        "CGST":{
            type:Sequelize.DOUBLE
        },
        "amount":{
            type:Sequelize.DOUBLE
        }
    },

    {
        tableName: "retailer_sales_details"
      })
    return roles
}
