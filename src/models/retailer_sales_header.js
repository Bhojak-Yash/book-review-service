module.exports =(sequelize,Sequelize)=>{
    const roles = sequelize.define("retailer_sales_header",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "billNumber":{
            type:Sequelize.STRING
        },
        "date":{
            type:Sequelize.DATE
        },
        "patientId":{
            type:Sequelize.INTEGER
        },
        "doctorId":{
            type:Sequelize.INTEGER
        },
        "address":{
            type:Sequelize.STRING
        },
        "regNo":{
            type: Sequelize.STRING
        },
        "subTotal":{
            type:Sequelize.DOUBLE
        },
        "discount":{
            type:Sequelize.DOUBLE
        },
        "totalAmt":{
            type:Sequelize.DOUBLE
        },
        "SGST":{
            type:Sequelize.DOUBLE
        },
        "CGST":{
            type:Sequelize.DOUBLE
        }
    },

    {
        tableName: "retailer_sales_header"
      })
    return roles
}
