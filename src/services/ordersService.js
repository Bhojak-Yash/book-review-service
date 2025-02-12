const message = require('../helpers/message');
const db = require('../models/db');
const StocksService = require('./stocksService');

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
            orderTo:Number(orderData.orderData.orderTo)
        },
      },{transaction})
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

    if(updates.orderStatus === "Confirmed" || updates.orderStatus === 'Rejected' || updates.orderStatus === 'Ready to ship' || updates.orderStatus === 'Ready to pickup' || updates.orderStatus === 'Dispatched'){
      if (order.orderTo != loggedInUserId) {
        throw new Error("Unauthorized to update this order.");
      }
    }else{
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
}

module.exports = OrdersService;
