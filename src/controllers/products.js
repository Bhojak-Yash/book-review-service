const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const {verifyToken} = require('../middlewares/auth')


exports.getproducts = async (req, res) => {
    try {
        const {page} = req.query
        let skip  =0;
        let limit = 20
        if(page || Number(page)){
            skip = (Number(page)-1)*limit
        }
        const products = await sequelize.query(`
            SELECT 
                PId, 
                PName, 
                MRP, 
                Packing
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

        let totalPage= Math.ceil(Number(productCount.totalProducts)/limit)
        
        res.json({
            status:message.code200,
            message:message.message200,
            currentPage:page || 1,
            totalPage:totalPage,
            apiData:products
        })
    } catch (error) {
        console.log("inquiry error:", error.message)
        res.json({
            status: message.code500,
            message: message.message500,
            apiData: null
        })
    }
}

// Get All products by manufacturerId

exports.getAllProductsByManufacturerId = async (req, res) => {
    console.log(req.params);
    const { manufacturerId } = req.params;
  
    try {
      const products = await db.products.findAll({
        where: { manufacturerId },
      });
  
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found for this manufacturer." });
      }
  
      return res.status(200).json({ message: "Products retrieved successfully.", products });
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ message: "Failed to retrieve products.", error: error.message });
    }
  };

  // get productDetails by PId

  exports.getProductDetails = async (req, res) => {
    const { PId } = req.params;
  
    try {
      const product = await db.products.findOne({
        where: { PId: PId },
      });
  
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }
  
      return res.status(200).json({ message: "Product details retrieved successfully.", product });
    } catch (error) {
      console.error("Error fetching product details:", error);
      return res.status(500).json({ message: "Failed to retrieve product details.", error: error.message });
    }
  };
  


// Add single product
exports.addProduct = async (req,res) => {
    const { manufacturerId, ...productData } = req.body;
  try {
    // Check if the product already exists
    const existingProduct = await db.products.findOne({
      where: {
        PName: productData.PName,
        manufacturerId,
      },
    });

    if (existingProduct) {
      return res.status(409).json({ message: `Product '${productData.PName}' already exists.` });
    }

    // Add the new product
    const newProduct = await db.products.create({
      ...productData,
      manufacturerId,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    });

    return res.status(201).json({ message: 'Product added successfully.', product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ message: 'Failed to add product.', error: error.message });
  }
};

// Update single product
exports.updateProduct = async (req, res) => {
    const { PId,manufacturerId, ...productData } = req.body;
    try {
      // Check if the product exists
      const existingProduct = await db.products.findOne({
        where: {
          PId: PId,
          manufacturerId,
        },
      });
  
      if (!existingProduct) {
        return res.status(404).json({ message: `Product with ID '${PId}' not found.` });
      }
  
      // Update the product
      await db.products.update(
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
  
      return res.status(200).json({ message: 'Product updated successfully.' });
    } catch (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ message: 'Failed to update product.', error: error.message });
    }
  };
  
