const message = require('../helpers/message');
const db = require('../models/db');
const Op = db.Op


class RetailerSalesService {
    constructor(db) {
        this.db = db;
    }

    async searchMedicine(data) {
        try {
            const {search,id,limit,page} = data
            // console.log(data)
            if(!search || search.length<3){
                return {
                    status:message.code400,
                    message:'Invalid input'
                }
            }
            const Limit = Number(limit) || 10
            const Page = Number(page) || 1
            let skip = 0
            if(Page>1){
                skip = (Page-1)*Limit
            }
            const halfLength = Math.floor(search?.length / 2);
            const firstHalf = search?.substring(0, halfLength);
            const firstThree = search?.substring(0, 3);

            const likeConditions= {
                [Op.or]: [
                    { [Op.eq]: search },
                    { [Op.like]: `%${search}%` },
                    { [Op.like]: `%${firstHalf}%` },
                    { [Op.like]: `${firstThree}%` }
                ]
            } 
            const {count,rows:Data} = await db.stocks.findAndCountAll({
                attributes:['SId','PId','BatchNo','MRP','PTR','ExpDate','Stock'],
                include:[
                    {
                        model:db.products,
                        as:"product",
                        attributes:['PId','PName','SaltComposition','manufacturerId','Package','HSN'],
                        where: {
                            PName: likeConditions
                        },
                        required:true,
                        include:[
                            {
                                model:db.manufacturers,
                                as:"manufacturer",
                                attributes:['manufacturerId','companyName'],
                            }
                        ]
                    }
                ],
                where:{organisationId:Number(id)},
                limit:Limit,
                offset:skip
            })
            // const formatData = {
            //     "SId": 93,
            //     "PId": 211,
            //     "BatchNo": "123",
            //     "MRP": 123,
            //     "PTR": 1123,
            //     "ExpDate": "2025-04-30T18:30:00.000Z",
            //     "Stock": 6,
            //     "product": {
            //         "PId": 211,
            //         "PName": "Apple",
            //         "SaltComposition": "Cyanide",
            //         "manufacturerId": 10,
            //         "Package": "",
            //         "HSN": 123123,
            //         "manufacturer": {
            //             "manufacturerId": 10,
            //             "companyName": "kushal"
            //         }
            //     }
            // }
            return {
                status:message.code200,
                message:message.message200,
                currentPage:Page,
                totalItem:count,
                totalPage:Math.ceil(count/Limit),
                apiData:Data
            }
        } catch (error) {
            console.log('searchMedicine service error:',error.message)
            return {
                status:message.code500,
                message:error.message
            }
        }
    }
}

module.exports = new RetailerSalesService(db);
