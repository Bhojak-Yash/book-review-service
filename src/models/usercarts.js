module.exports = (sequelize, Sequelize) => {
    const usercarts = sequelize.define(
      "usercarts",
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true, // Mark this as the primary key
          autoIncrement: true, // Automatically increment the ID
          allowNull: false,
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        stockId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        orderFrom: {
          type: Sequelize.BIGINT,
          allowNull: false 
        },
        orderTo: {
          type: Sequelize.BIGINT,
          allowNull: false
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
        PId: {
          type: Sequelize.INTEGER,
          allowNull: false
        }
      },
      {
        tableName: "usercarts",
      }
    );
    return usercarts;
  };
  