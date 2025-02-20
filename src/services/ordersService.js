const message = require('../helpers/message');
const db = require('../models/db');
const StocksService = require('./stocksService');
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
      transaction = await db.sequelize.transaction();

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
      await transaction.commit();
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
    // console.log(orderId,updates,loggedInUserId,';;lllll')
    const order = await this.db.orders.findByPk(orderId);
    const orderItems = await db.orderitems.findAll({
      where: { orderId: orderId },
    });
    // console.log(order,orderItems,';pppppp')
    if (!order) throw new Error("Order not found.");

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
      updates.confirmationDate = new Date();
      if (orderItems && orderItems.length > 0) {

        await db.sequelize.transaction(async (t) => {
          // First, check if all items have enough stock before making any updates
          for (const item of orderItems) {
            const [stock] = await db.sequelize.query(
              `SELECT Stock FROM stocks WHERE SId = :stockId`,
              {
                replacements: { stockId: item.stockId },
                type: db.Sequelize.QueryTypes.SELECT,
                transaction: t, // Use the transaction
              }
            );

            if (!stock || stock.Stock < item.quantity) {
              throw new Error(
                `Insufficient stock for item ID ${item.stockId}. Ensure sufficient stock is available.`
              );
            }
          }

          // If all items have sufficient stock, update them
          await Promise.all(
            orderItems.map(async (item) => {
              await db.sequelize.query(
                `UPDATE stocks SET Stock = Stock - :itemQuantity WHERE SId = :stockId`,
                {
                  replacements: {
                    itemQuantity: item.quantity,
                    stockId: item.stockId,
                  },
                  transaction: t, // Use the transaction
                }
              );
            })
          );
        });
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
              BoxQty: item.BoxQty,
              loose: item.loose
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

    if (updates.orderStatus === "Received" || updates.orderStatus === "Paid" || updates.orderStatus === "Partially paid") {
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
              `SELECT * FROM stocks WHERE SId = :stockId`,
              {
                replacements: { stockId: item.stockId },
                type: db.Sequelize.QueryTypes.SELECT,
                transaction: t, // Use the transaction
              }
            );
            await db.sequelize.query(
              `INSERT INTO stocks (PId, BatchNo,ExpDate, Stock,createdAt,updatedAt,organisationId,MRP,PTR,Scheme,BoxQty,loose) 
               VALUES (:PId, :BatchNo,:ExpDate ,:itemQuantity,:createdAt,:updatedAt,:organisationId,:MRP,:PTR,:Scheme,:BoxQty,:loose) 
               ON DUPLICATE KEY UPDATE Stock = Stock + :itemQuantity`,
              {
                replacements: {
                  itemQuantity: item.quantity,
                  PId: item.PId,
                  BatchNo: stock.BatchNo,
                  ExpDate: stock.ExpDate,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  organisationId: order.orderFrom,
                  MRP: item.MRP,
                  PTR: item.PTR,
                  Scheme: item.Scheme,
                  BoxQty: item.BoxQty,
                  loose: item.loose
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



    await this.db.orders.update(updates, { where: { id: orderId } });

    return this.db.orders.findByPk(orderId);
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
      const id = Number(data.id);
      const Page = Number(data.page) || 1;
      const Limit = Number(data.limit) || 10;
      let skip = 0;
      let whereClause = { orderFrom: id };

      if (Page > 1) {
        skip = (Page - 1) * Limit;
      }

      // Adjust search condition
      if (data.search) {
        whereClause[Op.or] = [
          { id: { [Op.like]: `%${data.search}%` } }, // Search by order ID
          {
            '$manufacturer.companyName$': { [Op.like]: `%${data.search}%` } // Search by manufacturer name
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
      // console.log(whereClause)
      const { count, rows: orders } = await db.orders.findAndCountAll({
        attributes: [
          "id",
          "orderDate",
          "dueDate",
          "deliveredAt",
          "invAmt",
          "orderStatus",
          "orderTo",
          "orderTotal",
          "invNo",
        ],
        include: [
          {
            model: db.manufacturers,
            as: "manufacturer",
            attributes: ["companyName"],
            required: false, // Ensure manufacturer is included even if no match is found
          },
        ],
        where: whereClause,
        offset: skip,
        limit: Limit,
      });
      "ENUM('Pending', 'Confirmed', 'Rejected', 'Ready to ship', 'Ready to pickup', 'Dispatched', 'Received', 'Paid', 'Partially paid', 'Canceled')"
      const upadtesResult = await orders?.map((order) => {
        return {
          "id": order.id,
          "orderDate": order.orderDate,
          "dueDate": order.dueDate,
          "deliveredAt": order.deliveredAt,
          "invAmt": order.invAmt,
          "status": order.orderStatus,
          // "deliveryStatus":orderStatus=='Ready to pickup'?"Pickup":orderStatus=='Ready to pickup'?
          "orderTo": order.orderTo,
          "orderTotal": order.orderTotal,
          "invNo": order.invNo,
        }
      })

      return {
        status: message.code200,
        message: message.message200,
        totalItems: count,
        currentPage: Page,
        totalPage: Math.ceil(count / Limit),
        apiData: upadtesResult,
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
      const id = Number(data.id);
      const Page = Number(data.page) || 1;
      const Limit = Number(data.limit) || 10;
      let skip = 0;
      let whereClause = { orderTo: id };

      if (Page > 1) {
        skip = (Page - 1) * Limit;
      }

      // Adjust search condition
      // if (data.search) {
      //   whereClause[Op.or] = [
      //     { id: { [Op.like]: `%${data.search}%` } }, // Search by order ID
      //     {
      //       '$manufacturer.companyName$': { [Op.like]: `%${data.search}%` } // Search by manufacturer name
      //     }
      //   ];
      // }
      if (data.start_date && data.end_date) {
        const startDate = moment(data.start_date, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment(data.end_date, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");

        whereClause.orderDate = {
          [Op.between]: [startDate, endDate]
        };
      }
      // console.log(whereClause)
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
                attributes: ["retailerId"],
                required: false,
              },
              {
                model: db.distributors,
                as: "disuser",
                attributes: ["distributorId", "companyName"],
                required: false,
              },
            ],
          },
        ],
        where: whereClause,
        offset: skip,
        limit: Limit,
      });

      const result = await orders?.map((order) => {
        return {
          "id": order.id,
          "orderDate": order.orderDate,
          "dueDate": order.dueDate,
          "deliveredAt": order.deliveredAt,
          "invAmt": order.invAmt,
          "status": order.orderStatus,
          "orderTo": order?.orderFromUser.reuser.length>0?order?.orderFromUser.reuser[0].firmName:order?.orderFromUser.disuser.companyName,
          "orderTotal": 2000,
          "invNo": "367225",
          "orderFromUser": {
            "id": 77,
            "userType": "Retailer",
            "reuser": [
              {
                "retailerId": 77
              }
            ],
            "disuser": []
          }
        }
      })

      return {
        status: message.code200,
        message: message.message200,
        totalItems: count,
        currentPage: Page,
        totalPage: Math.ceil(count / Limit),
        apiData: orders,
      };
    } catch (error) {
      console.log("distributer_sales_orders error:", error.message);
      return {
        status: message.code500,
        message: error.message,
      };
    }
  }

}

module.exports = OrdersService;
