const { where, NUMBER } = require('sequelize');
const message = require('../helpers/message');
const db = require('../models/db');
const StocksService = require('./stocksService');
const notificationsService = require('../services/notificationsService');
const _ = require('lodash');
const axios = require('axios')

const Op = db.Op;
const moment = require("moment");

class OrdersService {
  constructor(db) {
    this.db = db;
  }

  async createOrder(data, orderData) {
    // const { orderItems, ...orderDetails } = orderData;

    // const newOrder = await this.db.orders.create({
    //   ...orderDetails,
    //   orderFrom: loggedInUserId,
    // });

    // if (orderItems && orderItems.length > 0) {
    //   const orderItemsData = orderItems.map((item) => ({
    //     ...item,
    //     orderId: newOrder.id,
    //   }));
    //   await this.db.orderitems.bulkCreate(orderItemsData);
    // }

    // return newOrder;
    let transaction;
    try {
      let orderby;
      if (data.userType === 'Employee') {
        orderby = data.data.employeeOf
      } else {
        orderby = data.id
      }
      const checkAddress = await db.address.findOne({where:{userId:Number(orderby)}})
      console.log('address hai')
      if(!checkAddress){
        console.log('address nhi hai')
        return {
          status:message.code400,
          message:'Users address is required.'
        }
      }
      transaction = await db.sequelize.transaction();
      // console.log(orderData.orderItems);

      // double check cart item prices
      var mismatched = this.calculate_price(orderData.orderItems, orderData.orderData);

      if (mismatched == true) {
        return {
          status: 409,
          message: 'Mismatch in between the price of the items.'
        };
      }
      if(orderData?.orderData?.cnId){
      const checkCN = await db.creditNotes.findOne({where:{id:Number(orderData.orderData.cnId),issuedTo:Number(orderby),issuedBy:Number(orderData.orderData.orderTo),isSettled:false}})
      let cnValue = 0 
      orderData.orderData.cnId=null
      if(checkCN){
        let balance = Number(orderData.orderData.balance) || 0
        cnValue = Number(checkCN?.dataValues?.balance) || 0
        if(balance>cnValue){
          let amtdiff = balance - cnValue
          orderData.orderData.balance = amtdiff
        }else{
          orderData.orderData.balance=0
        }
        orderData.orderData.cnId=checkCN?.dataValues?.id
        await db.creditNotes.update({isSettled:true},{where:{id:Number(checkCN?.dataValues?.id)}})
      }
    }
      // console.log(checkCN,';;;;;;;;;;',orderData.orderData.orderTo,checkCN?.dataValues?.id,checkCN?.dataValues?.balance,cnValue)
      
      const newOrder = await db.orders.create({
        ...orderData.orderData,
        orderFrom: Number(orderby)
      }, { transaction })
      if (orderData.orderItems && orderData.orderItems.length > 0) {
        const orderItemsData = orderData?.orderItems.map((item) => ({
          ...item,
          orderId: newOrder.id,
        }));
        await db.orderitems.bulkCreate(orderItemsData, { transaction });
      }
      const deletedItemsCount = await db.usercarts.destroy({
        where: {
          orderFrom: Number(data.id),
          orderTo: Number(orderData.orderData.orderTo)
        },
      }, { transaction })


      // Calling the notificationService.............................................................................
      await notificationsService.createNotification({
        organisationId: orderData.orderData.orderTo,
        category: "PO Received",
        title: "New Purchase Order Received",
        description: `You have received a new purchase order.`
      }, transaction);

      await transaction.commit();
      // await axios.post(`${process.env.Socket_URL}/order-raise-notification`, {
      //   userId: Number(orderData?.orderData?.orderTo),
      //   title: "New Purchase Order Received",
      //   description: `You have received a new purchase order.`
      // })

      return {
        status: message.code200,
        message: message.message200,
        apiData: newOrder
      }
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.log('createOrder service error:', error.message)
      return {
        status: message.code500,
        message: message.message500
      }
    }
  }

  async updateOrder(orderId, updates, loggedInUserId) {
    // console.log(orderId, updates, loggedInUserId, ';;lllll')
    try {
      const order = await this.db.orders.findByPk(orderId);
      if (order?.dataValues.orderStatus == 'Settled') {
        return {
          status: message.code400,
          message: 'Action not allowed. This order has already been settled.'
        }
      }
      const orderToDeatils = await db.users.findOne({ where: { id: order?.dataValues?.orderTo } })
      const orderItems = await db.orderitems.findAll({
        where: { orderId: orderId },
      });
      // console.log('pppppppppppppppppp')

      const tableName = orderToDeatils?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
      const tableNameRow = orderToDeatils?.userType === 'Manufacturer' ? 'manufacturer_stocks' : "stocks";
      const orderFromRow = orderToDeatils?.userType === 'Manufacturer' ? 'manufacturer_stocks' : "stocks";
      // console.log(order,orderItems,';pppppp')
      if (!orderItems) {
        throw new Error("Order items not found.");
      }
      if (updates?.payment) {
        const { amount, mode, image } = updates?.payment
        await db.payments.create({
          orderId: Number(orderId),
          amount: Number(amount),
          mode: mode,
          image: image,
          status: 'Pending'
        })

        const data = await db.orders.findOne({ where: { id: Number(orderId) } })
        const aaa = Number(Number(data.dataValues.balance).toFixed(2))

        if (Number(aaa) <= 0) {
          throw new Error("Payment already completed for this order.");
        }

        let oStatus = 'Paid'
        if (Number(aaa) > Number(amount)) {
          console.log('[[[[[[[[[[')
          oStatus = 'Partially paid'
        }

        let amtUpdate = amount;
        if (Number(aaa) <= Number(amount)) {
          amtUpdate = Number(data.dataValues.balance)
        }
        if (aaa - Number(amtUpdate) == 0) {
          oStatus = 'Paid'
        }
        if (data?.dataValues?.orderStatus === 'Confirmed' || data?.dataValues?.orderStatus === 'Pending' || data?.dataValues?.orderStatus === 'Dispatched') {
          oStatus = data?.dataValues?.orderStatus
        }
        console.log(oStatus, 'llllllllllllll', aaa, amtUpdate)
        await db.orders.update({ balance: db.sequelize.literal(`balance - ${Number(amtUpdate)}`), orderStatus: oStatus }, { where: { id: Number(orderId) } })
        return {
          status: message.code200,
          message: message.message200
        }
      }

      if (updates.orderStatus === "Confirmed" || updates.orderStatus === 'Rejected' || updates.orderStatus === 'Ready to ship' || updates.orderStatus === 'Ready to pickup' || updates.orderStatus === 'Dispatched') {
        if (order.orderTo != loggedInUserId) {
          throw new Error("Unauthorized to update this order.");
        }
      } else {
        if (order.orderFrom != loggedInUserId) {
          throw new Error("Unauthorized to update this order.");
        }
      }

      if (updates.orderStatus === "Confirmed") {
        //  console.log(';;;;;;;;;;;;;;;;;;')
        updates.confirmationDate = new Date();
        if (orderItems && orderItems.length > 0) {

          // await db.sequelize.transaction(async (t) => {
          //   // First, check if all items have enough stock before making any updates
          //   for (const item of updates.items) {
          //     // console.log('pppppppp')
          //     const [stock] = await db.sequelize.query(
          //       `SELECT Stock FROM ${tableNameRow} WHERE SId = :stockId`,
          //       {
          //         replacements: { stockId: item.stockId },
          //         type: db.Sequelize.QueryTypes.SELECT,
          //         transaction: t, // Use the transaction
          //       }
          //     );
          //     // console.log('ppppp',updates)
          //     if (!stock || Number(stock.Stock) < Number(item.quantity)) {
          //       throw new Error(
          //         `Insufficient stock for item ID ${item.stockId}. Ensure sufficient stock is available.`
          //       );
          //     }
          //   }
          //   console.log(updates?.items);

          //   for (let item of updates?.items) {
          //     console.log('dwekjh')
          //     await db.orderitems.update(item, { where: { id: item.id } }, { transaction: t });
          //   }

          //   // If all items have sufficient stock, update them
          //   await Promise.all(
          //     updates?.items?.map(async (item) => {
          //       // console.log(item?.stockId)
          //       await db.sequelize.query(
          //         `UPDATE ${tableNameRow} SET Stock = Stock - :itemQuantity WHERE SId = :stockId`,
          //         {
          //           replacements: {
          //             itemQuantity: item.quantity,
          //             stockId: item.stockId,
          //           },
          //           transaction: t,
          //         }
          //       );
          //       // await db.orderitems.update(item)
          //     })
          //   );
          // })

          await db.sequelize.transaction(async (t) => {
            for (const item of updates?.items) {
              const itemQty = Number(item?.quantity || 0);

              // 1. Check stock of current item.stockId
              const [mainStock] = await db.sequelize.query(
                `SELECT SId, Stock, PId, BatchNo, organisationId FROM ${tableNameRow} WHERE SId = :stockId`,
                {
                  replacements: { stockId: item.stockId },
                  type: db.Sequelize.QueryTypes.SELECT,
                  transaction: t,
                }
              );

              if (!mainStock) throw new Error(`Stock not found for SId ${item.stockId}`);

              const { PId, BatchNo, organisationId } = mainStock;

              // 2. Get all stocks with same PId, BatchNo, and organisationId
              const groupedStocks = await db.sequelize.query(
                `SELECT SId, Stock FROM ${tableNameRow}
       WHERE PId = :PId AND BatchNo = :BatchNo AND organisationId = :organisationId AND Stock > 0
       ORDER BY SId Desc`, // Prefer lower SId or change if needed
                {
                  replacements: { PId, BatchNo, organisationId },
                  type: db.Sequelize.QueryTypes.SELECT,
                  transaction: t,
                }
              );

              // 3. Sum available stock
              const totalAvailable = groupedStocks.reduce((sum, s) => sum + Number(s.Stock), 0);

              if (totalAvailable < itemQty) {
                throw new Error(
                  `Insufficient stock for PId ${PId}, BatchNo ${BatchNo}. Required: ${itemQty}, Available: ${totalAvailable}`
                );
              }

              // 4. Deduct stock across SIds in order
              let remainingQty = itemQty;
              for (const stock of groupedStocks) {
                if (remainingQty <= 0) break;

                const available = Number(stock.Stock);
                const deductQty = Math.min(available, remainingQty);

                await db.sequelize.query(
                  `UPDATE ${tableNameRow} SET Stock = Stock - :deductQty WHERE SId = :SId`,
                  {
                    replacements: {
                      deductQty,
                      SId: stock.SId,
                    },
                    transaction: t,
                  }
                );

                remainingQty -= deductQty;
              }

              // 5. Update order item with original data
              await db.orderitems.update(item, { where: { id: item.id }, transaction: t });
            }
          })

        }
        const orderFromUserType = await db.users.findOne({ attributes: ['userType'], where: { id: Number(order?.dataValues?.orderFrom) } })
        console.log('uiiuiuiuuiuiu', orderFromUserType?.dataValues?.userType)
        if (orderFromUserType?.dataValues?.userType === 'Retailer') {
          await db.authorizations.upsert({
            authorizedBy: Number(order?.dataValues?.orderTo),
            authorizedId: Number(order?.dataValues?.orderFrom),
            status: 'Approved'
          });
        }
        // console.log("testttttt");
        // Sending notification for PO Received
        await notificationsService.createNotification({
          organisationId: order.orderFrom,
          category: "PO Status update",
          title: "Purchase Order: Confirmed",
          description: `Your purchase order has been confirmed for orderId ${orderId}.`
        });
        // await axios.post(`${process.env.Socket_URL}/order-action-notification`, {
        //   userId: Number(order?.orderFrom),
        //   title: "Purchase Order: Confirmed",
        //   description: `Your purchase order has been confirmed for orderId ${orderId}.`
        // })
      }
      if(updates.orderStatus === "Rejected"){
        if(order?.cnId){
          await db.creditNotes.update({isSettled:false},{where:{id:Number(order?.cnId)}})
        }
      }

      if (updates.orderStatus === 'Dispatched') {
        // if (orderItems && orderItems.length > 0) {

        await db.sequelize.transaction(async (t) => {
          // First, check if all items have enough stock before making any updates
          // for (const item of updates.items) {
          // const [stock] = await db.sequelize.query(
          //   `SELECT * FROM stocks WHERE SId = :stockId`,
          //   {
          //     replacements: { stockId: item.stockId },
          //     type: db.Sequelize.QueryTypes.SELECT,
          //     transaction: t, // Use the transaction
          //   }
          // );
          await db.sequelize.transaction(async (t) => {
            // First, check if all items have enough stock before making any updates
            for (const item of updates.items) {
              // console.log(item,';;;;;;')
              db.orderitems.update({
                BoxQty: item?.BoxQty || 0,
                loose: item?.loose || 0
              }, { where: { id: Number(item.id) } }), { transaction: t }
            }

            // If all items have sufficient stock, update them
            // await Promise.all(
            //   orderItems.map(async (item) => {

            //   })
            // );          
          });
          // }

          // If all items have sufficient stock, update them
          // await Promise.all(
          //   orderItems.map(async (item) => {

          //   })
          // );          
        });
        // }
      }

      if (updates.orderStatus === "Inward" || updates.orderStatus === "Paid" || updates.orderStatus === "Partially paid") {
        updates.deliveredAt = new Date();
        // Retrieve the items in the order
        // const orderItems = await db.orderitems.findAll({
        //   where: { orderId: orderId },
        // });

        if (orderItems && orderItems.length > 0) {

          await db.sequelize.transaction(async (t) => {
            // First, check if all items have enough stock before making any updates
            for (const item of orderItems) {
              const [stock] = await db.sequelize.query(
                `SELECT * FROM ${tableNameRow} WHERE SId = :stockId`,
                {
                  replacements: { stockId: item.stockId },
                  type: db.Sequelize.QueryTypes.SELECT,
                  transaction: t, // Use the transaction
                }
              );
              // console.log(item,stock,order?.dataValues?.orderFrom,order?.dataValues?.orderTo)
              await db.sequelize.query(
                `INSERT INTO stocks (PId, BatchNo,ExpDate, Stock,createdAt,updatedAt,organisationId,MRP,PTS,PTR,Scheme,BoxQty,loose,purchasedFrom) 
               VALUES (:PId, :BatchNo,:ExpDate ,:itemQuantity,:createdAt,:updatedAt,:organisationId,:MRP,:PTS,:PTR,:Scheme,:BoxQty,:loose,:purchasedFrom) 
               ON DUPLICATE KEY UPDATE Stock = Stock + :itemQuantity`,
                {
                  replacements: {
                    itemQuantity: item.quantity,
                    PId: item.PId,
                    BatchNo: stock.BatchNo,
                    ExpDate: stock.ExpDate,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    organisationId: order?.dataValues?.orderFrom,
                    MRP: item.MRP,
                    PTS: item?.PTR,
                    PTR: item?.PTR,
                    Scheme: item.Scheme,
                    BoxQty: item.BoxQty,
                    loose: item.loose,
                    purchasedFrom: order?.dataValues?.orderTo
                  },
                  transaction: t, // Use the transaction
                }
              );

            }

            // If all items have sufficient stock, update them
            // await Promise.all(
            //   orderItems.map(async (item) => {

            //   })
            // );          
          });
        }
      }

      if (updates?.orderStatus === "Inward") {
        // console.log('inwarddddddddd')
        if (order?.dataValues?.balance == 0) {
          let sss = updates
          sss.orderStatus = 'Paid'
          const checkPayment = await db.payments.count({
            where: {
              orderId: Number(orderId),
              status: {
                [Op.ne]: 'Confirmed',
              },
            },
          });
          if (checkPayment <= 0) {
            sss.orderStatus = 'Settled'
          }
          await this.db.orders.update(sss, { where: { id: orderId } })
        } else if (order?.dataValues?.balance < order?.dataValues?.invAmt) {
          // console.log('bda haiiiiiiiiii')
          let sss = updates
          sss.orderStatus = 'Partially paid'
          console.log(sss)
          await this.db.orders.update(sss, { where: { id: orderId } });
        } else {
          await this.db.orders.update(updates, { where: { id: orderId } });
        }
      } else {
        await this.db.orders.update(updates, { where: { id: orderId } });
      }
      // console.log(updates?.orderStatus)
      if (updates?.orderStatus == "Cancelled") {
        // console.log('099999999999999999999999999999')
        await this.db.orders.update(updates, { where: { id: orderId } });
      }
      // if(updates?.orderStatus == "Rejected"){
      //   await axios.post(`${process.env.Socket_URL}/order-action-notification`, {
      //     userId: Number(order?.orderFrom),
      //     title: "Purchase Order: Rejected",
      //     description: `Your purchase order has been Rejected for orderId ${orderId}.`
      //   })
      // }
      // const aaa=await this.db.orders.findByPk(orderId);
      // console.log(aaa)
      return await this.db.orders.findByPk(orderId);
    } catch (error) {
      console.log('update order servcie error:', error.message)
      return {
        status: message.code500,
        message: error.message
      }
    }
  }

  // async updateOrder(data) {
  //   try {
  //     const orderData = await db.orders.findOne({where:{id:Number(data.orderId)}})
  //     return {
  //       status:message.code200,
  //       message:message.message200,
  //       apiData:orderData
  //     }
  //   } catch (error) {
  //     console.log('updateOrder service error:',error.message)
  //     return {
  //       status:message.code500,
  //       message:error.message
  //     }
  //   }
  // }

  async getOrdersByFilters(filters) {
    console.log(filters);
    const whereClause = {
      orderDate: {
        [this.db.Sequelize.Op.between]: [filters.startDate, filters.endDate],
      },
    };

    if (filters.orderTo) {
      whereClause.orderTo = filters.orderTo;
    } else if (filters.orderFrom) {
      whereClause.orderFrom = filters.orderFrom;
    }

    const ordersList = await this.db.orders.findAll({
      where: whereClause,
      include: [
        {
          model: this.db.users,
          as: "orderToUser",
          attributes: ["id", "username"],
        },
        {
          model: this.db.users,
          as: "orderFromUser",
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return ordersList.map((order) => {
      const tag = filters.orderTo ? "Sales Orders" : filters.orderFrom ? "Purchase Orders" : null;
      return { ...order.toJSON(), tag };
    });
  }

  async getOrdersByType(filters, orderType, loggedInUserId) {

    if (orderType === "sales") {
      filters.orderTo = loggedInUserId;
    } else if (orderType === "purchase") {
      filters.orderFrom = loggedInUserId;
    } else {
      throw new Error("Invalid order type.");
    }

    return this.getOrdersByFilters(filters);
  }

  async distributer_purchase_orders(data) {
    try {
      let id = Number(data?.id);
      if(data?.userType === "Employee"){
        id = data?.data?.employeeOf
      }
      const Page = Number(data.page) || 1;
      const Limit = Number(data.limit) || 10;
      let skip = 0;
      let whereClause = { orderFrom: id };
      console.log(id)
      if (Page > 1) {
        skip = (Page - 1) * Limit;
      }

      // Adjust search condition
      if (data.search) {
        whereClause[Op.or] = [
          { id: { [Op.like]: `%${data.search}%` } }, // Search by order ID
          {
            '$manufacturer.companyName$': { [Op.like]: `%${data.search}%` } // Search by manufacturer name
          },
          {
            '$distributor.companyName$': { [Op.like]: `%${data.search}%` } // Search by manufacturer name
          }
        ];
      }
      
      if (data.start_date && data.end_date) {
        const startDate = moment(data.start_date, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment(data.end_date, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");

        whereClause.orderDate = {
          [Op.between]: [startDate, endDate]
        };
      }
       if (data.status) {
        if (data.status === 'Unpaid') {
          whereClause.balance = { [Op.gt]: 0 };
        }else if(data?.status === 'Delivered'){
          whereCondition.orderStatus={
            [db.Op.in]:['Inward','Partially paid','Paid']
          }
        }
         else {
          whereClause.orderStatus = data.status;
        }
      }

      const { count, rows: orders } = await db.orders.findAndCountAll({
        attributes: [
          "id",
          "orderDate",
          "dueDate",
          "deliveredAt",
          "invAmt",
          "orderStatus",
          "orderTo",
          "orderFrom",
          "orderTotal",
          "invNo",
          "balance",
          "deliveryType",
          "reason"
        ],
        include: [
          {
            model: db.manufacturers,
            as: "manufacturer",
            attributes: ["companyName"],
            required: false, // Ensure manufacturer is included even if no match is found
          },
          {
            model: db.distributors,
            as: "distributor",
            attributes: ["companyName"],
            required: false, // Ensure manufacturer is included even if no match is found
          },
          {
            model: db.authorizations,
            where: { authorizedId: Number(id) },
            as: "auth",
            attributes: ['creditCycle'],
            required: false
          }
        ],
        where: whereClause,
        offset: skip,
        limit: Limit,
        order: [["id", "DESC"]]
      });
      // "ENUM('Pending', 'Confirmed', 'Rejected', 'Ready to ship', 'Ready to pickup', 'Dispatched', 'Received', 'Paid', 'Partially paid', 'Canceled')"
      const updatesResult = orders?.map((order) => {
        let overdue = false;

        if (order.deliveredAt && order.auth?.creditCycle) {
          const deliveredDate = new Date(order.deliveredAt);

          deliveredDate.setDate(deliveredDate.getDate() + order.auth.creditCycle);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          overdue = deliveredDate < today;
        }

        return {
          "id": order.id,
          "orderDate": order.orderDate,
          "dueDate": order.dueDate,
          "deliveredAt": order.deliveredAt,
          "invAmt": order.invAmt,
          "status": order.orderStatus,
          "orderTotal": order.orderTotal,
          "invNo": order.invNo,
          "balance": order.balance,
          "orderTo": order.manufacturer?.companyName || order?.distributor.companyName || order?.order,
          "deliveryType": order.deliveryType,
          // "auth": order.auth,
          "overdue": overdue,
          "reason": order?.reason || ''
        };
      });


      return {
        status: message.code200,
        message: message.message200,
        totalItems: count,
        currentPage: Page,
        totalPage: Math.ceil(count / Limit),
        apiData: updatesResult,
      };
    } catch (error) {
      console.log("distributer_purchase_orders service error:", error.message);
      return {
        status: message.code500,
        message: error.message,
      };
    }
  }

  async distributer_sales_orders(data) {
    try {
      let id = Number(data.id);
      if(data?.userType === "Employee"){
        id = data.data.employeeOf
      }
      console.log(id);
      const Page = Number(data.page) || 1;
      const Limit = Number(data.limit) || 10;
      let skip = (Page - 1) * Limit;
      let whereClause = { orderTo: id };

      // Date Filter
      if (data.start_date && data.end_date) {
        const startDate = moment(data.start_date, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment(data.end_date, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");
        whereClause.orderDate = { [Op.between]: [startDate, endDate] };
      }

      // Status Filter
      if (data.status) {
        if (data.status === 'Unpaid') {
          whereClause.balance = { [Op.gt]: 0 };
        }else if(data?.status === 'Delivered'){
          whereClause.orderStatus={
            [db.Op.in]:['Inward','Partially paid','Paid']
          }
        }
         else {
          whereClause.orderStatus = data.status;
        }
      }

      // Search Filter
      if (data.search) {
        whereClause[Op.or] = [
          { id: { [Op.like]: `%${data.search}%` } }, // Search by orderId
        ];
      }
      if (data.orderFromUser) {
        whereClause.orderFrom = Number(data.orderFromUser);
      }

      // console.log(whereClause,'oppppppp')
      const { count, rows: orders } = await db.orders.findAndCountAll({
        attributes: [
          "id", "orderDate", "dueDate", "deliveredAt", "invAmt",
          "orderStatus", "orderTo", "orderFrom", "orderTotal", "invNo", "balance", "reason", "deliveryType"
        ],
        include: [
          {
            model: db.users,
            as: "orderFromUser",
            attributes: ["id", "userType"],
            required: false,
            include: [
              {
                model: db.retailers,
                as: "reuser",
                attributes: ["retailerId", "firmName"],
                required: false
              },
              {
                model: db.distributors,
                as: "disuser",
                attributes: ["distributorId", "companyName"],
                required: false
              },
            ],
          },
        ],
        where: whereClause,
        offset: skip,
        limit: Limit,
        order: [["id", "DESC"]]
      });

      // Formatting Result
      const result = orders.map((order) => {
        let orderFrom = "";
        let userType = "";

        if (order?.orderFromUser?.reuser?.length > 0) {
          orderFrom = order?.orderFromUser.reuser[0].firmName;
          userType = "Retailer";
        } else if (order?.orderFromUser?.disuser?.length > 0) {
          orderFrom = order?.orderFromUser.disuser[0].companyName;
          userType = "Distributor";
        }

        return {
          id: order.id,
          orderDate: order.orderDate,
          dueDate: order.dueDate,
          deliveredAt: order.deliveredAt,
          invAmt: order.invAmt,
          balance: order.balance || 0,
          status: order.orderStatus,
          orderFrom: orderFrom,
          orderFromId: order.orderFrom,
          userType: userType,
          orderTotal: order.orderTotal,
          invNo: order.invNo,
          reason: order.reason || null,
          deliveryType: order?.deliveryType || null
        };
      });

      return {
        status: message.code200,
        message: message.message200,
        totalItems: count,
        currentPage: Page,
        totalPage: Math.ceil(count / Limit),
        apiData: result,
      };
    } catch (error) {
      console.log("distributer_sales_orders error:", error.message);
      return {
        status: message.code500,
        message: error.message,
      };
    }
  }

  async distributer_so_card_data(data) {
    try {
      const distributorId = Number(data.id);
      const whereClause = { orderTo: distributorId };

      // Parse and apply date filter
      if (data.startDate && data.endDate) {
        const [startDay, startMonth, startYear] = data.startDate.split("-");
        const [endDay, endMonth, endYear] = data.endDate.split("-");

        const start = new Date(`${startYear}-${startMonth}-${startDay}T00:00:00Z`);
        const end = new Date(`${endYear}-${endMonth}-${endDay}T23:59:59Z`);

        whereClause.createdAt = {
          [Op.between]: [start, end],
        };
      }

      // Total Orders
      const totalOrders = await db.orders.count({ where: whereClause });

      // Pending Orders (excluding 'Settled')
      const pendingOrders = await db.orders.count({
        where: {
          ...whereClause,
          orderStatus: { [Op.ne]: 'Settled' },
        },
      });

      // Completed Orders = Total - Pending
      const completedOrders = totalOrders - pendingOrders;

      // Orders with balance > 0
      const dueOrders = await db.orders.findAll({
        where: {
          ...whereClause,
          balance: { [Op.gt]: 0 },
        },
        attributes: [
          [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "dueCount"],
          [db.Sequelize.fn("SUM", db.Sequelize.col("balance")), "totalBalancePending"],
        ],
        raw: true,
      });

      // Get orderFrom IDs
      const ordersList = await db.orders.findAll({
        where: whereClause,
        attributes: ['orderFrom'],
        raw: true,
      });
      const orderFromIds = [...new Set(ordersList.map(order => order.orderFrom))];

      // Total Distributors (from distributors table)
      const totalDistributors = await db.distributors.count({
        where: {
          distributorId: { [Op.in]: orderFromIds },
          type: 'Distributor',
        },
      });

      // Total CNFs
      const totalCNF = await db.distributors.count({
        where: {
          distributorId: { [Op.in]: orderFromIds },
          type: 'CNF',
        },
      });

      // Pending Authorizations by distributorId
      const authWhere = {
        authorizedBy: distributorId,
        status: 'Pending',
      };

      if (whereClause.createdAt) {
        authWhere.createdAt = whereClause.createdAt;
      }

      const pendingAuthorizations = await db.authorizations.count({
        where: authWhere,
      });

      return {
        status: message.code200,
        message: message.message200,
        data: {
          totalOrders,
          pendingOrders,
          completedOrders,
          dueOrdersCount: Number(dueOrders[0]?.dueCount || 0),
          totalPendingAmount: Number(dueOrders[0]?.totalBalancePending || 0),
          totalDistributors,
          totalCNF,
          pendingAuthorizations,
        },
      };
    } catch (error) {
      console.log("distributer_so_card_data error:", error.message);
      return {
        status: message.code500,
        message: error.message,
      };
    }
  }


  // async purchase_order_summary(data) {
  //   try {
  //     const { id, orderId } = data
  //     const userId = Number(id)
  //     if (!id || !userId) {
  //       return {
  //         status: message.code400,
  //         message: 'orderId is required'
  //       }
  //     }
  //     // const user = await db.users.findOne({
  //     //   where: { id: Number(userId) },
  //     //   attributes: ['id'],
  //     //   include: [
  //     //     {
  //     //       model: db.manufacturers,
  //     //       as: "manufacturer",
  //     //       attributes: ["manufacturerId", "companyName"],
  //     //       required: false,
  //     //     },
  //     //     {
  //     //       model: db.distributors,
  //     //       as: "disuser",
  //     //       attributes: ["distributorId", "companyName"],
  //     //       required: false,
  //     //     },
  //     //     {
  //     //       model: db.address,
  //     //       as: "address",
  //     //       required: false,
  //     //     }
  //     //   ]
  //     // })

  //     // const updatedUser = {
  //     //   "id":user?.id,
  //     //   "companyName":user?.manufacturer[0]?user?.manufacturer[0].companyName:user?.disuser[0].companyName,
  //     //   "address":user?.address[0]?.addressType==='Billing'?user?.address[0]:user?.address[1]
  //     // }

  //     const aaa = await db.orders.findOne({ where: { id: Number(orderId) } })
  //     const checkUser = await db.users.findOne({ where: { id: Number(aaa?.dataValues?.orderTo) } })
  //     const tableName = checkUser?.dataValues?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
  //     const as = checkUser?.dataValues?.userType == 'Manufacturer' ? 'stocks' : 'stock';
  //     console.log(as,tableName,';;;;;;;;',checkUser?.dataValues?.userType)
  //     const order = await db.orders.findOne({
  //       // attributes:[''],
  //       where: { id: Number(orderId) },
  //       include: [
  //         {
  //           model: db.orderitems,
  //           as: "orderItems",
  //           include: [
  //             {
  //               model: db.products,
  //               as: "product",
  //               attributes: ['PId', 'PName', 'SaltComposition','PackagingDetails']
  //             },
  //             {
  //               model: tableName,
  //               as: as,
  //               attributes: ['SId', 'BatchNo', 'stock', 'PTS']
  //             }
  //           ]
  //         },
  //         {
  //           model: db.payments,
  //           as: 'payments',
  //         }
  //       ]
  //     })

  //     order.balance = parseFloat(order.balance).toFixed(2);

  //     const Op = db.Op

  //     const users = await db.users.findAll({
  //       where: { id: { [Op.or]: [Number(order.orderTo), Number(order.orderFrom)] } },
  //       attributes: ["id"],
  //       include: [
  //         {
  //           model: db.distributors,
  //           as: "disuser",
  //           attributes: ["distributorId", "companyName", "PAN", "GST"],
  //           required: false,
  //         },
  //         {
  //           model: db.retailers,
  //           as: "reuser",
  //           attributes: ["retailerId", "firmName", "PAN", "GST"],
  //           required: false,
  //         },
  //         {
  //           model: db.address,
  //           as: "address",
  //           required: false,
  //         },
  //       ],
  //     });

  //     // Extract users based on their IDs
  //     const userTo = users.find(user => user.id === Number(order.orderTo)) || null;
  //     const userFrom = users.find(user => user.id === Number(order.orderFrom)) || null;

  //     // Format the response for both users
  //     const formatUser = (user) => ({
  //       id: user?.id || null,
  //       companyName: user?.reuser?.[0]?.firmName || user?.disuser?.[0]?.companyName || null,
  //       PAN: user?.reuser?.[0]?.PAN || user?.disuser?.[0]?.PAN || null,
  //       GST: user?.reuser?.[0]?.GST || user?.disuser?.[0]?.GST || null,
  //       address: user?.address || null,
  //     });

  //     const formattedOrder = {
  //         "id": order?.id,
  //         "orderDate": order?.orderDate,
  //         "invNo": order?.invNo,
  //         "confirmationDate": order?.confirmationDate,
  //         "dueDate": order?.dueDate,
  //         "barcode": order?.barcode,
  //         "invAmt": order?.invAmt,
  //         "cNAmt": order?.cNAmt,
  //         "recdAmt": order?.recdAmt,
  //         "balance": order?.balance,
  //         "sMan": order?.sMan,
  //         "sMobile": order?.sMobile,
  //         "dMan": order?.dMan,
  //         "dMobile": order?.dMo,
  //         "orderStatus": order?.orderStatus,
  //         "orderFrom": order?.orderFrom,
  //         "orderTo": order?.orderTo,
  //         "orderTotal": order?.orderTotal,
  //         "deliveredAt": order?.deliveredAt,
  //         "entityId": order?.entityId,
  //         "reason": order?.reason,
  //         "invUrl": order?.invUrl,
  //         "deliveryType": order?.deliveryType,
  //         "dispatchDate": order?.dispatchDate,
  //         "createdAt": order?.createdAt,
  //         "updatedAt": order?.updatedAt,
  //         "orderItems": order?.orderItems?.map((item)=>{
  //           return {
  //             "id": item?.id,
  //             "invNo": item?.invNo,
  //             "PId": item?.PId,
  //             "quantity": item?.quantity,
  //             "schQty": item?.schQty,
  //             "price": item?.price,
  //             "MRP": item?.MRP,
  //             "PTR": item?.PTR,
  //             "sch_Per": item?.sch_Per,
  //             "cD_Per": item?.cD_Per,
  //             "iGST_Per": item?.iGST_Per,
  //             "cGST_Per": item?.cGST_Per,
  //             "sGST_Per": item?.sGST_Per,
  //             "gCESS_Per": item?.gCESS_Per,
  //             "grsAmt": item?.grsAmt,
  //             "netAmt": item?.netAmt,
  //             "wPAmt": item?.wPAmt,
  //             "schAmt": item?.schAmt,
  //             "cDAmt": item?.cDAmt,
  //             "gSTAmt": item?.gSTAmt,
  //             "gCESSAmt": item?.gCESSAmt,
  //             "taxable": item?.taxable,
  //             "createdAt": item?.createdAt,
  //             "updatedAt": item?.updatedAt,
  //             "deletedAt": item?.deletedAt,
  //             "orderId": item?.orderId,
  //             "stockId": item?.stockId,
  //             "BoxQty": item?.BoxQty,
  //             "Scheme": item?.Scheme,
  //             "loose": item?.loose,
  //             "PTS": item?.PTS,
  //             "product": item?.product,
  //             "stock": item?.stocks || item?.stock || {}
  //         }
  //         }),
  //         "payments": order?.payments

  //     }

  //     return {
  //       status: message.code200,
  //       message: "Order fetched successfully.",
  //       distributor: formatUser(userFrom), // Distributor details (orderFrom)
  //       manufacturer: formatUser(userTo),  // Manufacturer details (orderTo)
  //       order: formattedOrder,
  //     };
  //     ;
  //   } catch (error) {
  //     console.log('purchase_order_summary service error:', error.message)
  //     return {
  //       status: message.code500,
  //       message: message.message500,
  //       // apiData: null
  //     }
  //   }
  // }

  async purchase_order_summary(data) {
    try {
      const { id, orderId } = data
      const userId = Number(id)
      if (!id || !userId) {
        return {
          status: message.code400,
          message: 'orderId is required'
        }
      }

      const aaa = await db.orders.findOne({ where: { id: Number(orderId) } })
      const checkUser = await db.users.findOne({ where: { id: Number(aaa?.dataValues?.orderTo) } })
      const tableName = checkUser?.dataValues?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
      const as = checkUser?.dataValues?.userType == 'Manufacturer' ? 'stocks' : 'stock';
      const isManufacturer = checkUser?.dataValues?.userType === 'Manufacturer';
      const atrr = checkUser?.dataValues?.userType == 'Manufacturer' ?
        [
          "BatchNo",
          "PId",
          [db.Sequelize.fn('MAX', db.Sequelize.col('SId')), 'SId'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('stock')), 'stock'],
          [db.Sequelize.fn('MAX', db.Sequelize.col(`PTS`)), 'PTS'],
          [db.Sequelize.fn('MAX', db.Sequelize.col('ExpDate')), 'ExpDate'],
          [db.Sequelize.fn('MAX', db.Sequelize.col('location')), 'location'],
          [db.Sequelize.fn('MAX', db.Sequelize.col('Scheme')), 'Scheme'],
        ] :
        [
          "BatchNo",
          "PId",
          [db.Sequelize.fn('MAX', db.Sequelize.col('SId')), 'SId'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('stock')), 'stock'],
          [db.Sequelize.fn('MAX', db.Sequelize.col(`PTS`)), 'PTS'],
          [db.Sequelize.fn('MAX', db.Sequelize.col('ExpDate')), 'ExpDate'],
          [db.Sequelize.fn('MAX', db.Sequelize.col('location')), 'location'],
          [db.Sequelize.fn('MAX', db.Sequelize.col('Scheme')), 'Scheme']
        ]
      // let groupBy = checkUser?.dataValues?.userType == 'Manufacturer' ?
      //   ['PId', 'BatchNo'] :
      //   ['PId', 'BatchNo'];

      // console.log("isManufacturer", isManufacturer);

      // console.log(as, tableName, ';;;;;;;;', checkUser?.dataValues?.userType)
      const order = await db.orders.findOne({
        where: { id: Number(orderId) },
        include: [
          {
            model: db.orderitems,
            // attributes: orderItemsAtrr,
            as: "orderItems",
            include: [
              {
                model: db.products,
                as: "product",
                attributes: ['PId', 'PName', 'SaltComposition', 'PackagingDetails', 'Package', 'ProductForm', 'HSN'],
                include: [
                  {
                    model: db.manufacturers,
                    as: 'manufacturer',
                    attributes: ['manufacturerCode', 'manufacturerId']
                  }
                ]
              },
              // {
              //   model: tableName,
              //   as: as,
              //   // attributes: ['SId', 'BatchNo', 'stock', 'PTS', 'ExpDate', 'location', 'Scheme']
              //   attributes: atrr
              // }
            ]
          },
          {
            model: db.payments,
            as: 'payments',
          }
        ],
        // group: groupBy
      })

      order.balance = parseFloat(order.balance).toFixed(2);

      const Op = db.Op

      const users = await db.users.findAll({
        where: { id: { [Op.or]: [Number(order.orderTo), Number(order.orderFrom)] } },
        attributes: ["id"],
        include: [
          {
            model: db.distributors,
            as: "disuser",
            attributes: ["distributorId", "companyName", "PAN", "GST", 'distributorCode', 'FSSAI', 'wholeSaleDrugLicence', 'IFSC', 'AccHolderName', 'accountNumber','profilePic'],
            required: false,
          },
          {
            model: db.retailers,
            as: "reuser",
            attributes: ["retailerId", "firmName", "PAN", "GST", 'retailerCode', 'FSSAI', 'drugLicense', 'IFSC', 'AccHolderName', 'accountNumber','profilePic'],
            required: false,
          },
          {
            model: db.manufacturers,
            as: "manufacturer",
            attributes: ["manufacturerId", "companyName", "PAN", "GST", 'manufacturerCode', 'fssaiLicense', 'drugLicense', 'IFSC', 'AccHolderName', 'accountNumber','logo'],
            required: false,
          },
          {
            model: db.address,
            as: "address",
            required: false,
            include: [
              {
                model: db.states,
                as: "states",
                attributes: ['stateCode']
              }
            ]
          },
        ],
      });

      // Extract users based on their IDs
      const userTo = users.find(user => user.id === Number(order.orderTo)) || null;
      const userFrom = users.find(user => user.id === Number(order.orderFrom)) || null;
      // console.log(userTo.dataValues.manufacturer,'[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[')
      // Format the response for both users
      const formatUser = (user) => ({
        id: user?.id || null,
        companyName: user?.reuser?.[0]?.firmName || user?.disuser?.[0]?.companyName || user?.manufacturer?.[0]?.companyName || null,
        PAN: user?.reuser?.[0]?.PAN || user?.disuser?.[0]?.PAN || user?.manufacturer?.[0]?.PAN || null,
        GST: user?.reuser?.[0]?.GST || user?.disuser?.[0]?.GST || user?.manufacturer?.[0]?.GST || null,
        fssai: user?.reuser?.[0]?.FSSAI || user?.disuser?.[0]?.FSSAI || user?.manufacturer?.[0]?.fssaiLicense || null,
        userCode: user?.reuser?.[0]?.retailerCode || user?.disuser?.[0]?.distributorCode || user?.manufacturer?.[0]?.manufacturerCode || null,
        drugLicense: user?.reuser?.[0]?.drugLicense || user?.disuser?.[0]?.wholeSaleDrugLicence || user?.manufacturer?.[0]?.drugLicense || null,
        accountNumber: user?.reuser?.[0]?.accountNumber || user?.disuser?.[0]?.accountNumber || user?.manufacturer?.[0]?.accountNumber || null,
        AccHolderName: user?.reuser?.[0]?.AccHolderName || user?.disuser?.[0]?.AccHolderName || user?.manufacturer?.[0]?.AccHolderName || null,
        IFSC: user?.reuser?.[0]?.IFSC || user?.disuser?.[0]?.IFSC || user?.manufacturer?.[0]?.IFSC || null,
        profilePic: user?.reuser?.[0]?.profilePic || user?.disuser?.[0]?.profilePic || user?.manufacturer?.[0]?.logo || null,
        address: user?.address || null,
        // stateCode:user?.address?.states?.stateCode || null,
      });

      const discount = Number(order?.subTotal) - Number(order?.taxable);
      const discountPercentage = order?.subTotal ? (discount / Number(order?.subTotal)) * 100 : 0;
      let SIDs = await order?.orderItems?.map((item) => { return item.stockId })
      console.log(SIDs)
      const stocks = await tableName.findAll({
        attributes: ['PId', 'BatchNo'],
        where: {
          SId: {
            [db.Sequelize.Op.in]: SIDs
          }
        },
      });
      const pids = await stocks?.map((item) => { return item.PId })
      const BatchNo = await stocks?.map((item) => { return item.BatchNo })
      const maxCount = await tableName.findAll({
        attributes: atrr,
        where: {
          Stock: { [db.Op.gt]: 0 },
          PId: { [db.Sequelize.Op.in]: pids },
          BatchNo: { [db.Sequelize.Op.in]: BatchNo },
          organisationId: aaa?.dataValues?.orderTo
        },
        group: ['PId', 'BatchNo']
      });

      // console.log(maxCount)
      const formattedOrder = {
        "id": order?.id,
        "orderDate": order?.orderDate,
        "invNo": order?.invNo,
        "confirmationDate": order?.confirmationDate,
        "dueDate": order?.dueDate,
        "barcode": order?.barcode,
        "invAmt": order?.invAmt,
        "cNAmt": order?.cNAmt,
        "recdAmt": order?.recdAmt,
        "balance": order?.balance,
        "sMan": order?.sMan,
        "sMobile": order?.sMobile,
        "dMan": order?.dMan,
        "dMobile": order?.dMo,
        "orderStatus": order?.orderStatus,
        "orderFrom": order?.orderFrom,
        "orderTo": order?.orderTo,
        "orderTotal": order?.orderTotal,
        "deliveredAt": order?.deliveredAt,
        "entityId": order?.entityId,
        "reason": order?.reason,
        "invUrl": order?.invUrl,
        "deliveryType": order?.deliveryType,
        "dispatchDate": order?.dispatchDate,
        "createdAt": order?.createdAt,
        "updatedAt": order?.updatedAt,
        "subTotal": Number(order?.subTotal),
        "discount": Number(discount.toFixed(2)),
        "discountPercentage": Number(discountPercentage.toFixed(2)),
        "advance": Number(order?.advance) || 0,
        "extraDiscount": Number(order?.extraDiscount) || 0,
        "extraDiscountValue": Number(Number(order?.taxable) * order?.extraDiscount / 100),
        "CGST": order?.CGST,
        "SGST": order?.SGST,
        "IGST": order?.IGST,
        "taxable": order?.taxable,
        "vehicleNo": order?.vehicleNo,
        "EWayBillNo": order?.EWayBillNo,
        "creditPeriod": order?.creditPeriod,
        "referralCode": order?.referralCode,
        "dMobile": order?.dMobile,
        "orderItems": order?.orderItems?.map((item) => {
          return {
            "id": item?.id,
            "invNo": item?.invNo,
            "PId": item?.PId,
            "quantity": item?.quantity,
            "schQty": item?.schQty,
            "price": item?.price,
            "MRP": item?.MRP,
            "PTR": item?.price,
            "isManufacturer": isManufacturer,
            "sch_Per": item?.sch_Per,
            "cD_Per": item?.cD_Per,
            "iGST_Per": item?.iGST_Per,
            "cGST_Per": item?.cGST_Per,
            "sGST_Per": item?.sGST_Per,
            "gCESS_Per": item?.gCESS_Per,
            "grsAmt": item?.grsAmt,
            "netAmt": item?.netAmt,
            "wPAmt": item?.wPAmt,
            "schAmt": item?.schAmt,
            "cDAmt": item?.cDAmt,
            "gSTAmt": item?.gSTAmt,
            "gCESSAmt": item?.gCESSAmt,
            "taxable": item?.taxable,
            "createdAt": item?.createdAt,
            "updatedAt": item?.updatedAt,
            "deletedAt": item?.deletedAt,
            "orderId": item?.orderId,
            "stockId": item?.stockId,
            "BoxQty": item?.BoxQty,
            "Scheme": item?.Scheme,
            "loose": item?.loose,
            // "PTS": item?.PTS,
            "product": item?.product,
            "stock": maxCount.find(s => s.dataValues.PId === item.PId) || {}
          }
        }),
        "payments": order?.payments
      }

      // Determine tax type based on state
      const getStateFromAddress = (user) => {
        const billingAddress = user?.address?.find(addr => addr.addressType === 'Billing');
        return billingAddress?.State || null;
      };


      const fromState = getStateFromAddress(userFrom);
      const toState = getStateFromAddress(userTo);

      let taxType = null;
      if (fromState && toState) {
        taxType = (fromState?.trim()?.toLowerCase() === toState?.trim()?.toLowerCase()) ? 'SGST_CGST' : 'IGST';
      }
// console.log(fromState,toState,taxType,(fromState == toState),typeof(fromState),typeof(toState))
      return {
        status: message.code200,
        message: "Order fetched successfully.",
        distributor: formatUser(userFrom), // Distributor details (orderFrom)
        manufacturer: formatUser(userTo),  // Manufacturer details (orderTo)
        order: formattedOrder,
        taxType: taxType || 'Unknown'
      };
    } catch (error) {
      console.log('purchase_order_summary service error:', error.message)
      return {
        status: message.code500,
        message: message.message500,
        // apiData: null
      }
    }
  }

  async confirm_payment(data) {
    try {
      const { id, paymentId } = data
      const checkAllPayments = await db.payments.findAll({ where: { id: Number(paymentId) } })
      if (checkAllPayments.length > 0) {
        const checkOrders = await db.orders.findOne({ attributes: ['id', 'orderStatus', 'balance'], where: { id: Number(checkAllPayments[0]?.orderId) } })
        if (checkOrders?.dataValues?.balance == 0) {
          if (checkOrders?.dataValues?.orderStatus == 'Paid' || checkOrders?.dataValues?.orderStatus == 'Inward') {
            await db.orders.update({ orderStatus: "Settled" }, { where: { id: Number(checkAllPayments[0]?.orderId) } })
          }
        }
      }
      await db.payments.update(
        { status: 'Confirmed' },
        { where: { id: Number(paymentId) } }
      );
      return {
        status: message.code200,
        message: message.code200
      }
    } catch (error) {
      console.log('confirm_payment service error:', error.message)
      return {
        status: message.code500,
        message: message.message500
      }
    }
  }


  async getAddressDetails(data) {
    try {
      let userId = data?.id
      if(data?.userType === "Employee"){
        userId = data?.data?.employeeOf
      }
      console.log(userId);
      const addresses = await db.address.findAll({
        where: {
          userId: userId,
          addressType: ['Billing', 'Business']
        }
      });

      let billingAddress = null;
      let businessAddress = null;

      addresses.forEach(address => {
        if (address.addressType === 'Billing') {
          billingAddress = address;
        } else if (address.addressType === 'Business') {
          businessAddress = address;
        }
      });

      return {
        success: true,
        data: {
          billingAddress,
          businessAddress
        }
      };
    } catch (error) {
      console.error("Error in getAddressDetails Service:", error.message);
      throw new Error("Failed to fetch address details");
    }
  }

  async updateAddressDetails(userId, addressPayload) {
    try {
      const results = {};
      const addressTypes = ['billingAddress', 'businessAddress'];

      for (const type of addressTypes) {
        if (addressPayload[type]) {
          const addressTypeLabel = type === 'billingAddress' ? 'Billing' : 'Business';

          const [updated] = await db.address.update(addressPayload[type], {
            where: {
              userId: userId,
              addressType: addressTypeLabel
            }
          });

          results[type] = updated > 0
            ? `${addressTypeLabel} address updated successfully`
            : `No ${addressTypeLabel.toLowerCase()} address found to update`;
        }
      }

      return {
        success: true,
        message: results
      };
    } catch (error) {
      console.error("Error in updateAddressDetails Service:", error.message);
      throw new Error("Failed to update address details");
    }
  }

  async calculate_price(orderItems, orderData) {

    // console.log(orderData);

    var mismatched = false;
    try {
      ///const { orderId, orderItems } = data;

      if (!Array.isArray(orderItems)) {
        // return {
        //   status: 400,
        //   message: 'Order ID and orderItems are required.'
        // };
        return true;
      }

      const stockIds = [];

      for (const payloadItem of orderItems) {
        if (payloadItem.stockId) {
          stockIds.push(payloadItem.stockId);
        }
      }

      console.log('Stock IDs from payload:', stockIds);

      const { orderTo } = orderData;
      const user = await db.users.findOne({
        where: { id: orderTo }
      });

      if (!user) {
        // return {
        //   status: 404,
        //   message: `User with orderTo ${orderTo} not found.`
        // };
        return true;
      }

      console.log("User:", user);
      const stocksTable = user.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
      const SellingPrice = user.userType === 'Manufacturer' ? 'PTS' : 'PTR';
      console.log("Using Stock Table:", stocksTable);

      const existingStocks = await stocksTable.findAll({
        attributes: [
          "SId",
          "MRP",
          SellingPrice
        ],
        where: {
          SId: stockIds
        }
      });
      console.log("Existing stocks", existingStocks);



      for (const payloadItem of orderItems) {
        // Find matching stock in existingStocks based on stockId
        const matchingStock = existingStocks.find(stock => stock.SId === payloadItem.stockId);

        if (!matchingStock) {
          // return {
          //   status: 404,
          //   message: `StockId ${payloadItem.stockId} not found in existing stocks.`
          // };
          return true;
        }

        if (Number(matchingStock.MRP) !== Number(payloadItem.MRP)) {
          console.log(`MRP mismatch for stockId ${payloadItem.stockId}:`);
          console.log(`Payload MRP: ${payloadItem.MRP}, DB MRP: ${matchingStock.MRP}`);
          mismatched = true;
          // return {
          //   status: 400,
          //   message: `MRP mismatch for stockId ${payloadItem.stockId}. Payload MRP: ${payloadItem.MRP}, DB MRP: ${matchingStock.MRP}`
          // };
          return mismatched;
        }

        let price = user.userType === 'Manufacturer' ? payloadItem.PTS : payloadItem.PTR;

        if (Number(price) !== Number(payloadItem.price)) {
          console.log(payloadItem.price);
          console.log(`Price mismatch for stockId ${payloadItem.stockId}:`);
          console.log(`Payload price: ${payloadItem.price}, DB Price: ${price}`);
          mismatched = true;
          // return {
          //   status: 400,
          //   message: `Price mismatch for stockId ${payloadItem.stockId}. Payload price: ${payloadItem.price}, DB Price: ${price}`
          // };
          return mismatched;
        }
      }
      // return {
      //   status: 200,
      //   message: 'All MRP values matched successfully.'
      // };
      return mismatched;
    } catch (error) {
      console.error('Error in calculate_price:', error.message);
      // return {
      //   status: 500,
      //   message: 'Internal server error.'
      // };
      return true;
    }
  }

  async remove_order_item(data) {
    try {
      const { id, itemId, orderId, userType } = data
      const checkId = userType === "Employee" ? data?.data?.employeeOf : id;
      const checkOrder = await db.orders.findOne({
        where: {
          id: Number(orderId),
          [db.Op.or]: [
            { orderTo: Number(checkId) },
            { orderFrom: Number(checkId) }
          ]
        }
      });
      if (!checkOrder) {
        return {
          status: message.code400,
          message: 'You are not authorized'
        }
      }
      await db.orderitems.destroy({
        where: { id: Number(itemId) }
      })
      return {
        status: message.code200,
        message: message.message200
      }
    } catch (error) {
      console.log('remove_order_item service error:', error.message)
      return {
        status: message.code500,
        message: message.message500
      }
    }
  }

  async getCreditNote(tokenData, url) {
    try {
      // Determine the actual ID to use
      let userId = tokenData.id;
      if (tokenData?.userType === "Employee") {
        userId = tokenData?.tokenData?.employeeOf;
      }

      console.log("IssuedTo:", userId);
      console.log("IssuedBy (url):", url);

      // Fetch the latest unsettled credit note for the given criteria
      const creditNote = await db.creditNotes.findOne({
        where: {
          issuedTo: userId,
          issuedBy: url,
          isSettled: 0
        },
        order: [['createdAt', 'DESC']]
      });

      if (!creditNote) {
        return {
          status: 404,
          message: "No unsettled credit note found for this user and URL."
        };
      }

      return {
        status: 200,
        message: "Latest unsettled credit note fetched successfully.",
        data: creditNote
      };

    } catch (error) {
      console.error("Error in getCreditNote:", error);
      return {
        status: 500,
        message: "Internal Server Error"
      };
    }
  }

}

module.exports = OrdersService;
