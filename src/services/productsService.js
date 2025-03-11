const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const sequelize =db.sequelize
// const products = require('../models/products')
const Products = db.products;
const Op = db.Op;

class ProductsService {
    constructor(db) {
        this.db = db;
    }

    async addProduct(data) {
        try {
            const { manufacturerId, ...productData } = data;
            // Check if the product already exists
            const existingProduct = await Products.findOne({
                where: {
                    PName: productData.PName,
                    manufacturerId,
                },
            });

            if (existingProduct) {
                return { status: message.code200, message: `Product '${productData.PName}' already exists.` };
            }

            // Add the new product
            const newProduct = await Products.create({
                ...productData,
                manufacturerId,
                CreatedAt: new Date(),
                UpdatedAt: new Date(),
            });

            return { status: message.code200, message: 'Product added successfully.', product: newProduct }
        } catch (error) {
            console.error('Error adding product:', error.message);
            return { status: message.code500, message: 'Failed to add product.', error: error.message };
        }
    }

    async updateProduct(data) {
        try {
            const { PId, manufacturerId, ...productData } = data;
            // Check if the product exists
            const existingProduct = await Products.findOne({
                where: {
                    PId: PId,
                    manufacturerId,
                },
            });

            if (!existingProduct) {
                return { status: message.code400, message: `Product with ID '${PId}' not found.` };
            }

            // Update the product
            await Products.update(
                {
                    ...productData,
                    UpdatedAt: new Date(),
                },
                {
                    where: {
                        PId: PId,
                        manufacturerId,
                    },
                }
            );

            return { status: message.code200, message: 'Product updated successfully.' };
        } catch (error) {
            console.error('Error updating product:', error);
            return { status: message.code500, message: 'Failed to update product.', error: error.message };
        }
    }

    async getproducts(data) {
        try {
            const { page } =data
            let skip = 0;
            let limit = 20
            if (page || Number(page)) {
                skip = (Number(page) - 1) * limit
            }
            const products = await sequelize.query(`
                SELECT 
                    PId, 
                    PName, 
                    MRP, 
                    PackingDetails
                FROM 
                    products
                LIMIT :limit OFFSET :skip
            `, {
                replacements: {
                    limit: limit,
                    skip: skip
                },
                type: sequelize.QueryTypes.SELECT // Execute as a SELECT query
            });

            const [productCount] = await sequelize.query(`
                SELECT COUNT(*) AS totalProducts
                FROM products
            `, {
                type: sequelize.QueryTypes.SELECT
            });

            let totalPage = Math.ceil(Number(productCount.totalProducts) / limit)

            return {
                status: message.code200,
                message: message.message200,
                currentPage: page || 1,
                totalPage: totalPage,
                apiData: products
            }
        } catch (error) {
            console.log("getproducts error:", error.message)
            return {
                status: message.code500,
                message: message.message500,
                apiData: null
            }
        }
    }

    async getAllProductsByManufacturerId(data) {

        try {
            // console.log(data,';p;p;p;');
            const { manufacturerId,page,limit,locked,search } = data;
            let Page = Number(page) || 1;
            let Limit = Number(limit) || 10;
            let skip  = 0;
            if(Page>1){
                skip = (Page-1)*Limit
            }
            let whereCondition ={
                manufacturerId,
            }
            if(locked){
                whereCondition.LOCKED=locked=="true"?true:false
            }

            if (search) {
                whereCondition[Op.or] = [
                    { PName: { [Op.like]: `%${search}%` } },
                    { PCode: { [Op.like]: `%${search}%` } },
                    { SaltComposition: { [Op.like]: `%${search}%` } },
                ];
            }

            const totalItems = await Products.count({
                where: whereCondition,
            });
            const products = await Products.findAll({
                where: whereCondition,
                limit:Limit,
                offset:skip
            });

            let totalPage = Math.ceil(totalItems/Limit)

            if (products.length === 0) {
                return { status: message.code400, message: "No products found for this manufacturer." };
            }

            return { status: message.code200, message: "Products retrieved successfully.",currentPage:Page,totalPage:totalPage,totalItems, products };
        } catch (error) {
            console.error("Error fetching products:", error);
            return { status: message.code500, message: "Failed to retrieve products.", error: error.message };
        }
    }

    async productDetails(data) {

        try {
            const { PId } = data;
            const product = await Products.findOne({
                where: { PId: PId },
            });

            if (!product) {
                return { status: 404, message: "Product not found." };
            }

            return { status: message.code200, message: "Product details retrieved successfully.", product };
        } catch (error) {
            console.error("Error fetching product details:", error.message);
            return { status: message.code500, message: "Failed to retrieve product details.", error: error.message };
        }
    }

}

module.exports = new ProductsService(db);
