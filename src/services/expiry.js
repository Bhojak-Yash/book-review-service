const message = require('../helpers/message');
const db = require('../models/db');


class expiryService {
    constructor(db) {
        this.db = db;
    }

    async expire_product_list(data){
        // try {
        //     const {id} = data
        //     const {count,rows} = await db.stocks.findAndCountAll({
        //         attributes:['SId','PId','BatchNo','ExpDate','MRP','PTR','PTS','Stock'],
        //         include:[
        //             {
        //                 model:db.products,
        //                 as:"product",
        //                 attributes:['PId','PName'],
        //                 required:true
        //             }
        //         ]
        //     })
        //     return {
        //         status:message.code200,
        //         message:message.message200,
        //         apiData:rows
        //     }
        // } 
        try {
            let { page, limit,id } = data;
    
            page = page ? parseInt(page) : 1;
            limit = limit ? parseInt(limit) : 10;
            const offset = (page - 1) * limit;
    
            const { count, rows } = await db.manufacturers.findAndCountAll({
                attributes: ["manufacturerId", "companyName"],
                include: [
                    {
                        model: db.products,
                        as: "products",
                        attributes: ["PId", "PName"],
                        include: [
                            {
                                model: db.stocks,
                                as: "stocks",
                                attributes: ["SId", "organisationId"],
                                where: {
                                    Stock: { [db.Sequelize.Op.gt]: 0 },
                                    organisationId: Number(59), // Moved inside stocks' where clause
                                },
                                required: true
                            }
                        ],
                        required: true // Ensures only products with stock are included
                    }
                ],
                distinct: true, // Avoid duplicate manufacturers
                limit,
                offset,
                order: [["companyName", "ASC"]],
            });
            
            
    
            return {
                totalManufacturers: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                manufacturers: rows
            }
        } catch (error) {
            console.log('expire_product_list service error:',error.message)
            return {
                status:message.code500,
                message:message.message500
            }
        }
    }

}

module.exports = new expiryService(db);
