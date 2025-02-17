module.exports =(sequelize,Sequelize)=>{
    const orderitems = sequelize.define("orderitems",{
       
          invNo: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          PId: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          quantity: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          schQty: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          price: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          MRP: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          PTR: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          sch_Per: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          cD_Per: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          iGST_Per: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          cGST_Per: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          sGST_Per: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          gCESS_Per: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          grsAmt: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          netAmt: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          wPAmt: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          schAmt: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          cDAmt: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          gSTAmt: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          gCESSAmt: {
            type: Sequelize.DECIMAL,
            allowNull: true,
          },
          taxable: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          orderId: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          stockId: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          BoxQty:{
            type: Sequelize.INTEGER,
          },
          Scheme:{
            type: Sequelize.STRING
          },
          loose:{
            type: Sequelize.INTEGER,
          }
    },
    {
        tableName: "orderitems"
      })
    return orderitems
}
// OrderId
// Item Name
// Price
// Quantity
// Total amount