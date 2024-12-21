const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const {verifyToken} = require('../middlewares/auth')




// Get All Stocks by manufacturerId

// exports.getAllStocksByManufacturerId = async (req, res) => {
//     console.log(req.params);
//     const { manufacturerId } = req.params;
  
//     try {
//       const stocks = await db.stocks.findAll({
//         where: { manufacturerId },
//       });
  
//       if (stocks.length === 0) {
//         return res.status(404).json({ message: "No Stocks found for this manufacturer." });
//       }
  
//       return res.status(200).json({ message: "Stocks retrieved successfully.", stocks });
//     } catch (error) {
//       console.error("Error fetching Stocks:", error);
//       return res.status(500).json({ message: "Failed to retrieve Stocks.", error: error.message });
//     }
//   };

// get stocks of a product

exports.getStockDetails = async (req, res) => {
    const { PId } = req.params;
  
    try {
      const stock = await db.stocks.findAll({
        where: { PId: PId },
      });
  
      if (!stock) {
        return res.status(404).json({ message: "Stock not found." });
      }
  
      return res.status(200).json({ message: "Stock details retrieved successfully.", stock });
    } catch (error) {
      console.error("Error fetching Stock details:", error);
      return res.status(500).json({ message: "Failed to retrieve Stock details.", error: error.message });
    }
  };

// Add single product
exports.addStock = async (req,res) => {
    const { manufacturerId, ...stocksData } = req.body;
  try {

   
    // Add the new product
    const newStock = await db.stocks.create({
      ...stocksData,
      manufacturerId,
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    });

    return res.status(201).json({ message: 'Product added successfully.', product: newStock });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ message: 'Failed to add product.', error: error.message });
  }
};

// Update single product
exports.updateStock = async (req, res) => {
    const { SId,manufacturerId, ...stockData } = req.body;
    try {
      // Check if the product exists
      const existingStock = await db.stocks.findOne({
        where: {
          SId: SId,
          manufacturerId,
        },
      });
  
      if (!existingStock) {
        return res.status(404).json({ message: `Product with ID '${SId}' not found.` });
      }
  
      // Update the product
      await db.stocks.update(
        {
          ...stockData,
          UpdatedAt: new Date(),
        },
        {
          where: {
            SId: SId,
            manufacturerId,
          },
        }
      );
  
      return res.status(200).json({ message: 'Stock updated successfully.' });
    } catch (error) {
      console.error('Error updating Stock:', error);
      return res.status(500).json({ message: 'Failed to update Stock.', error: error.message });
    }
  };

  // Get all products and stocks of a manufacturer
exports.getStockDetailsByManufacturer = async (req, res) => {
  const { manufacturerId } = req.params;

  try {
    const stockDetails = await db.stocks.findAll({
      include: [
        {
          model: db.products,
          as: 'product', // Alias used for the relationship in the Sequelize model
          attributes: ['PId', 'PCode', 'PName'], // Specify columns from products table
        },
      ],
      where: { manufacturerId },
    });

    if (!stockDetails || stockDetails.length === 0) {
      return res.status(404).json({ message: "Stock not found." });
    }

    return res.status(200).json({
      message: "Stock details retrieved successfully.",
      stockDetails,
    });
  } catch (error) {
    console.error("Error fetching Stock details:", error);
    return res.status(500).json({
      message: "Failed to retrieve Stock details.",
      error: error.message,
    });
  }
};

  
