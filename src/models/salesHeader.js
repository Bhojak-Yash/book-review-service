module.exports =(sequelize,Sequelize)=>{
    const SalesHeader = sequelize.define("sales_header",{
        "id":{
            type:Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "date":{
            type:Sequelize.DATE
        },
        "partyId":{
            type:Sequelize.INTEGER
        },
        "address":{
            type:Sequelize.STRING
        },
        "subTotal":{
            type:Sequelize.DECIMAL
        },
        "discount":{
            type:Sequelize.DECIMAL
        },
        "totalAmt":{
            type:Sequelize.DECIMAL
        },
        "balance":{
            type:Sequelize.DECIMAL
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
        "organisationId":{
            type:Sequelize.INTEGER
        },
        "paymentMode":{
            type:Sequelize.ENUM("Cash",'Online','Credit','Card')
        },
        "orderStatus":{
            type: Sequelize.ENUM(
            'Pending', 'Confirmed', 'Rejected', 'Ready to ship', 'Ready to pickup', 'Dispatched', 
            'Inward', 'Paid', 'Partially paid', 'Cancelled','Settled'),
        },
        "inv_url":{
            type:Sequelize.STRING
        },
        "deliveryType":{
            type:Sequelize.DATE
        },
        "deliveryDate":{
            type:Sequelize.DATE
        },
        "extraDiscountValue":{
            type:Sequelize.DECIMAL
        },
        "extraDiscountPercent":{
            type:Sequelize.DECIMAL
        },
        "advance":{
            type:Sequelize.DECIMAL
        }
    },

    {
        tableName: "sales_header"
      })
    return SalesHeader
}
