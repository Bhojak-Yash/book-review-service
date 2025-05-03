module.exports = (sequelize, Sequelize) => {
    const orders = sequelize.define(
      "orders",
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true, // Mark this as the primary key
          autoIncrement: true, // Automatically increment the ID
          allowNull: false,
        },
        // orderNo: {
        //   type: Sequelize.STRING,
        // },
        orderDate: {
          type: Sequelize.DATE, // Corrected data type
        },
        invNo: {
          type: Sequelize.STRING,
        },
        confirmationDate: {
          type: Sequelize.DATE, // Corrected data type
        },
        dueDate: {
          type: Sequelize.DATE, // Corrected data type
        },
        barcode: {
          type: Sequelize.INTEGER,
        },
        invAmt: {
          type: Sequelize.DOUBLE,
        },
        cNAmt: {
          type: Sequelize.DOUBLE,
        },
        recdAmt: {
          type: Sequelize.DOUBLE,
        },
        balance: {
          type: Sequelize.DOUBLE,
        },
        sMan: {
          type: Sequelize.STRING,
        },
        sMobile: {
          type: Sequelize.STRING,
        },
        dMan: {
          type: Sequelize.STRING,
        },
        dMobile: {
          type: Sequelize.STRING,
        },
        orderStatus: {
          type: Sequelize.ENUM(
            'Pending', 'Confirmed', 'Rejected', 'Ready to ship', 'Ready to pickup', 'Dispatched', 
            'Inward', 'Paid', 'Partially paid', 'Cancelled','Settled'),
        },
        orderFrom: {
          type: Sequelize.BIGINT,
        },
        orderTo: {
          type: Sequelize.BIGINT,
        },
        orderTotal: {
          type: Sequelize.BIGINT
        },
        deliveredAt: {
          type: Sequelize.DATE, // Corrected data type
        },
        // divisionId: {
        //   type: Sequelize.BIGINT, // Corrected data type
        // },
        
        entityId: {
          type: Sequelize.INTEGER,
        },
        reason: {
          type: Sequelize.STRING, // Corrected data type
        },
        invUrl:{
          type:Sequelize.STRING
        },
        deliveryType:{
          type:Sequelize.STRING
        },
        dispatchDate:{
          type:Sequelize.DATE
        },
        IGST:{
          type: Sequelize.DOUBLE
        },
        CGST:{
          type: Sequelize.DOUBLE
        },
        SGST:{
          type: Sequelize.DOUBLE
        },
        subTotal:{
          type: Sequelize.STRING
        },
        taxable:{
          type:Sequelize.DOUBLE
        },
        vehicleNo:{
          type:Sequelize.STRING
        },
        EWayBillNo:{
          type:Sequelize.STRING
        },
        extraDiscount:{
          type:Sequelize.BIGINT
        },
        creditPeriod:{
          type:Sequelize.INTEGER
        },
        advance:{
          type:Sequelize.BIGINT
        },
        TCS:{
          type:Sequelize.BIGINT
        }
      },
      {
        tableName: "orders",
      }
    );
    return orders;
  };
  