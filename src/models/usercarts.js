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
      
        PId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      
        price: {
          type: Sequelize.DECIMAL,
          allowNull: false,
        },
        MRP: {
          type: Sequelize.DECIMAL,
          allowNull: false,
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
        stockId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        orderFrom: {
          type: Sequelize.BIGINT,
        },
        orderTo: {
          type: Sequelize.BIGINT,
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
        }
      },
      {
        tableName: "usercarts",
      }
    );
    return usercarts;
  };
  