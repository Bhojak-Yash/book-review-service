module.exports =(sequelize,Sequelize)=>{
    const items = sequelize.define("orderitems",{
        "orderId":{
            type:Sequelize.STRING
        },
        "itemName":{
            type:Sequelize.STRING
        },
        "price":{
            type:Sequelize.DOUBLE
        },
        "quantity":{
            type:Sequelize.INTEGER
        },
        "totalAmount":{
            type:Sequelize.BIGINT
        }
    },
    {
        tableName: "orderitems"
      })
    return items
}
// OrderId
// Item Name
// Price
// Quantity
// Total amount