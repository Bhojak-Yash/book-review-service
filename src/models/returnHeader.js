module.exports = (sequelize, Sequelize) => {
    const orders = sequelize.define(
      "return_header",
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true, 
          autoIncrement: true, 
          allowNull: false,
        },
        returnDate: {
          type: Sequelize.DATE, 
        },
        returnId: {
          type: Sequelize.STRING,
        },
        confirmationDate: {
          type: Sequelize.DATE, 
        },
        dueDate: {
          type: Sequelize.DATE,
        },
        barcode: {
          type: Sequelize.INTEGER,
        },
        returnAmt: {
          type: Sequelize.DOUBLE,
        },
        cNAmt: {
          type: Sequelize.DOUBLE,
        },
        balance: {
          type: Sequelize.DOUBLE,
        },
        returnStatus: {
          type: Sequelize.ENUM(
            'Pending', 'Confirmed', 'Rejected', 'Canceled'),
        },
        returnFrom: {
          type: Sequelize.BIGINT,
        },
        returnTo: {
          type: Sequelize.BIGINT,
        },
        returnTotal: {
          type: Sequelize.BIGINT
        },
        reason: {
          type: Sequelize.STRING,
        },
      },
      {
        tableName: "return_header",
      }
    );
    return orders;
  };
  