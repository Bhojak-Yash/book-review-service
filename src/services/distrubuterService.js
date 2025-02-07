const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;

async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

class DistributorService {
    constructor(db) {
        this.db = db;
    }

    async createDistributors(data) {
        let transaction;
        try {
            const { userName, password, companyName } = data;

            if (!userName || !password || !companyName) {
                return {
                    error: false,
                    status: message.code400,
                    message: "All fields are required",
                }
            }
            transaction = await db.sequelize.transaction();

            const hashedPassword = await hashPassword(password);

            const user = await Users.create(
                {
                    userName: userName,
                    password: hashedPassword,
                    userType: 'Distributor',
                    status: "Active"
                },
                { transaction }
            );

            await Distributors.create(
                {
                    distributorId: user.id,
                    companyName: companyName,
                },
                { transaction }
            );
            // Commit the transaction
            await transaction.commit();
            return {
                error: false,
                status: message.code200,
                message: message.message200,
            }
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('createDistributor error:', error.message)
            return {
                error: true,
                status: message.code500,
                message: error.message,
            }
        }
    }

    async updateDistributors(data) {
        try {
            const { distributorid, logo, companyName, ownerName, email, phone, address, GST, licence } = data;

            if (!distributorid) {
                return {
                    status: message.code400,
                    message: "Distributor ID is required",
                }
            }

            const distributor = await Distributors.findByPk(distributorid);

            if (!distributor) {
                return {
                    status: 404,
                    message: "Distributor not found",
                }
            }

            // Update manufacturer details
            await distributor.update({
                logo: logo || distributor.logo,
                companyName: companyName || distributor.companyName,
                ownerName: ownerName || distributor.ownerName,
                email: email || distributor.email,
                phone: phone || distributor.phone,
                address: address || distributor.address,
                GST: GST || distributor.GST,
                licence: licence || distributor.licence,
            });

            return {
                status: message.code200,
                message: message.message200,
            }
        } catch (error) {
            console.log("updateDistributor error:", error.message);
            return {
                status: message.code500,
                message: error.message,
            }
        }
    }

    async getManufacturer(data) {
        try {
            const { id, search } = data;

            // Sanitize input values
            const authorizedId = Number(id);
            const searchQuery = search ? `%${search}%` : null;
            // console.log(id,authorizedId,searchQuery)
            // Construct the SQL query dynamically
            let query = `
                SELECT mn.manufacturerId, mn.companyName 
                FROM crm_db.authorizations AS au
                LEFT JOIN crm_db.manufacturers AS mn
                ON au.authorizedBy = mn.manufacturerId
                WHERE au.authorizedId = :authorizedId
                AND au.status IN ('Approved', 'Not Send')
            `;

            // Append search filter if provided
            if (searchQuery) {
                query += ` AND mn.companyName LIKE :searchQuery`;
            }

            // Execute the query using parameterized values
            const Data = await db.sequelize.query(query, {
                replacements: { authorizedId, searchQuery },
                type: db.Sequelize.QueryTypes.SELECT
            });

            return {
                status: message.code200,
                message: message.message200,
                apiData: Data
            };
        } catch (error) {
            console.log('getManufacturer service error:', error.message);
            return {
                status: 500,
                message: error.message
            };
        }
    }

    async getStocksByManufacturer(data) {
        try {
            const { id, manufacturerId, page, limit, search } = data
            // console.log(id,manufacturerId)
            const whereCondition = { manufacturerId: Number(manufacturerId) };

            if (search && search.trim() !== "") {
                whereCondition.PName = { [db.Sequelize.Op.like]: `%${search}%` };
            }
            const Page = Number(page) || 1
            const Limit = Number(limit) || 10
            let skip = 0
            if (Page > 1) {
                skip = (Page - 1) * Limit
            }
            if (!manufacturerId) {
                return {
                    status: 404,
                    message: 'Manufacturer not found'
                }
            }

            const [manufacturer] = await db.sequelize.query(
                `SELECT 
                    mn.manufacturerId, 
                    mn.companyName,
                    mn.logo,
                    au.id AS authorizationId,
                    au.status, 
                    JSON_ARRAYAGG(
                      JSON_OBJECT(
                        'addressType', ad.addressType, 
                        'name', ad.name, 
                        'mobile', ad.mobile, 
                        'city', ad.city, 
                        'state', ad.state
                      )
                    ) AS addresses
                 FROM manufacturers AS mn
                 LEFT JOIN authorizations AS au
                   ON mn.manufacturerId = au.authorizedBy AND au.authorizedId = :id
                 LEFT JOIN \`address\` AS ad
                   ON ad.userId = mn.manufacturerId
                 WHERE mn.manufacturerId = :manufacturerId
                 GROUP BY mn.manufacturerId, mn.companyName, au.id, au.status`,
                {
                    replacements: {
                        manufacturerId: Number(manufacturerId),
                        id: Number(id),
                    },
                    type: db.Sequelize.QueryTypes.SELECT,
                }
            );
            if (manufacturer.status != 'Approved' && manufacturer.status != 'Not Send') {
                return {
                    status: 400,
                    message: "Not authorized"
                }
            }

            const stocks = await db.stocks.findAll({
                attributes: ['SId', 'BatchNo', 'ExpDate', 'PTR', 'Scheme', 'MRP'],
                include: [
                    {
                        model: db.products,
                        as: 'product',
                        attributes: ['PId', 'PCode', "manufacturerId", 'PName', 'PackagingDetails', 'SaltComposition'],
                        where: whereCondition
                    }
                ],
                offset: skip,
                limit: Limit
            })
            const updatedStock = await stocks.map((item) => {
                if (manufacturer.status === 'Approved') {
                    return {
                        "SId": item.SId,
                        "PId": item.product.PId,
                        "PCode": item.product.PCode,
                        "manufacturerId": item.product.manufacturerId,
                        "PName": item.product.PName,
                        "PCode": item.product.PCode,
                        "PackagingDetails": item.product.PackagingDetails,
                        "SaltComposition": item.product.SaltComposition,
                        "PTR": item.PTR,
                        "MRP": item.MRP,
                        "BatchNo": item.BatchNo,
                        "ExpDate": item.ExpDate,
                        "Scheme": item.Scheme
                    }
                } else {
                    return {
                        "SId": item.SId,
                        "PId": item.product.PId,
                        "PCode": item.product.PCode,
                        "manufacturerId": item.product.manufacturerId,
                        "PName": item.product.PName,
                        "PCode": item.product.PCode,
                        "PackagingDetails": item.product.PackagingDetails,
                        "SaltComposition": item.product.SaltComposition,
                        "PTR": null,
                        "MRP": null,
                        "BatchNo": item.BatchNo,
                        "ExpDate": item.ExpDate,
                        "Scheme": null
                    }
                }
            })
            const totalCount = await db.products.count({ where:whereCondition })

            // const totalCount = updatedStock.length
            const totalPage = Math.ceil(totalCount / Limit)
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: totalPage,
                totalData: totalCount,
                limit:Limit,
                apiData: { manufacturer, stocks: updatedStock }
            }
        } catch (error) {
            console.log('getStocksByManufacturer service error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }
}

module.exports = new DistributorService(db);
