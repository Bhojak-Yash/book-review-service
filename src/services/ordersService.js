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
    const order = await this.db.orders.findByPk(orderId);
    const orderItems = await db.orderitems.findAll({
      where: { orderId: orderId },
    });
    if (!order) throw new Error("Order not found.");

    if (order.orderTo !== loggedInUserId) {
      throw new Error("Unauthorized to update this order.");
    }

    if (updates.orderStatus === "Approved") {
      updates.confirmationDate = new Date();
      const existingAuthorization = await this.db.authorizations.findOne({
        where: {
          authorizedBy: loggedInUserId,
          authorizedTo: order.orderFrom,
        },
      });

      if (!existingAuthorization) {
        await this.db.authorizations.create({
          authorizedBy: loggedInUserId,
          authorizedId: order.orderFrom,
          status: "Approved",
        });
      }
    }

    if (updates.orderStatus === "Delivered") {
      updates.deliveredAt = new Date();

      // Retrieve the items in the order
      const orderItems = await db.orderitems.findAll({
        where: { orderId: orderId },
      });

      if (orderItems && orderItems.length > 0) {
        // Loop through each item and directly update the stock
        await Promise.all(
          orderItems.map(async (item) => {
            const [result, metadata] = await db.sequelize.query(
              `
                UPDATE stocks
                SET Stock = Stock - :itemQuantity
                WHERE SId = :stockId AND quantity >= :itemQuantity
                RETURNING SId
                `,
              {
                replacements: {
                  itemQuantity: item.quantity,
                  stockId: item.stockId,
                },
              }
            );

            if (!result || result.length === 0) {
              throw new Error(
                `Insufficient stock for item ID ${item.stockId}. Ensure sufficient stock is available.`
              );
            }
          })
        );
      }
    }



    await this.db.orders.update(updates, { where: { id: orderId } });

    return this.db.orders.findByPk(orderId);
  }

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
