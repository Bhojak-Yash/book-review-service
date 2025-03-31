module.exports = (sequelize, Sequelize) => {
    const orders = sequelize.define(
      "return_details",
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true, 
          autoIncrement: true, 
          allowNull: false,
        },
        returnId:{
          type:Sequelize.STRING
        },
        PId: {
          type: Sequelize.BIGINT, 
        },
        SId: {
          type: Sequelize.BIGINT,
        },
        BoxQty:{
          type:Sequelize.BIGINT
        },
        Stock:{
          type:Sequelize.BIGINT
        },
        quantity: {
          type: Sequelize.BIGINT, 
        }
      },
      {
        tableName: "return_details",
      }
    );
    return orders;
  };
  