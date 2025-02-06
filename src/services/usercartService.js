const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');

class UsersCartService {
    constructor(db) {
        this.db = db;
    }

    async addToCart(data) {
        try {
            const { id, quantity, SId, orderTo } = data
            if (!id || !quantity || !SId || !orderTo) {
                return {
                    status: message.code400,
                    message: 'Invalid data'
                }
            }

            let check = await db.usercarts.findOne({ where: { orderFrom: Number(id), stockId: Number(SId), orderTo: Number(orderTo) } })
            if (check) {
                await db.usercarts.update(
                    { quantity: Number(quantity) },
                    { where: { id: check.id } }
                )
                check.quantity = Number(quantity)
                return {
                    status: message.code200,
                    message: 'quantity updated succefully',
                    apiData: check
                }
            } else {
                const data = await db.usercarts.create({
                    stockId: Number(SId),
                    orderFrom: Number(id),
                    orderTo: Number(orderTo),
                    quantity: Number(quantity)
                })
                return {
                    status: message.code200,
                    message: 'added to cart',
                    apiData: data
                }
            }
        } catch (error) {
            console.log('addToCart service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async discardCart(data) {
        try {
            const { id } = data
            // Delete all items from the cart for the logged-in user
            const deletedItemsCount = await db.usercarts.destroy({
                where: {
                    orderFrom: Number(id),
                },
            });

            if (deletedItemsCount > 0) {
                return {
                    message: "Cart discarded successfully.",
                    itemsDiscarded: deletedItemsCount,
                };
            } else {
                return {
                    status: 404,
                    message: "No items found in the cart to discard.",
                };
            }
        } catch (error) {
            console.log('discardCart service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async deleteCartItem(data) {
        try {
            const { id, cartItemId } = data
            // console.log(data)
            const cartItem = await db.usercarts.destroy({
                where: {
                    id: Number(cartItemId),
                    orderFrom: Number(id),
                },
            });

            if (!cartItem > 0) {
                return {
                    status: 404,
                    message: "Cart item not found or does not belong to the logged-in user.",
                }
            }
            return {
                status: message.code200,
                message: 'Cart item removed'
            }
        } catch (error) {
            console.log('deleteCartItem service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async getUserCart(data) {
        try {
            const { id } = data
            // Fetch all items in the cart for the logged-in user
            const cartItems = await db.usercarts.findAll({
                where: {
                    orderFrom: Number(id),
                },
                include: [
                    {
                        model: db.products, // Include associated product details if needed
                        as: "productDetails",
                        attributes: ["PName"], // Adjust fields as per your database schema
                    },
                ],
            });

            // Check if the cart is empty
            if (!cartItems.length) {
                return {
                    status: message.code200,
                    message: "Your cart is empty.",
                    cart: [],
                };
            }

            return {
                status: message.code200,
                message: "Cart fetched successfully.",
                cart: cartItems,
            };
        } catch (error) {
            console.error("getUserCart servcie error:", error);
            return { status:message.code500, message: error.message };
        }
    }
}

module.exports = new UsersCartService(db);
