const StocksService = require('../services/stocksService');

// Get All Stocks by Manufacturer ID
exports.getAllStocksByManufacturerId = async (req, res) => {
  const { manufacturerId } = req.params;

  try {
    const stocks = await StocksService.getAllStocksByManufacturerId(manufacturerId);

    if (stocks.length === 0) {
      return res.status(404).json({ message: "No Stocks found for this manufacturer." });
    }

    return res.status(200).json({ message: "Stocks retrieved successfully.", stocks });
  } catch (error) {
    console.error("Error fetching Stocks:", error);
    return res.status(500).json({ message: "Failed to retrieve Stocks.", error: error.message });
  }
};

// Get Stock Details
exports.getStockDetails = async (req, res) => {
  const { PId } = req.params;

  try {
    const stock = await StocksService.getStockDetails(PId);

    if (!stock) {
      return res.status(404).json({ message: "Stock not found." });
    }

    return res.status(200).json({ message: "Stock details retrieved successfully.", stock });
  } catch (error) {
    console.error("Error fetching Stock details:", error);
    return res.status(500).json({ message: "Failed to retrieve Stock details.", error: error.message });
  }
};

// Add Stock
exports.addStock = async (req, res) => {
  const { manufacturerId, ...stocksData } = req.body;

  try {
    const newStock = await StocksService.addStock(manufacturerId, stocksData);

    return res.status(201).json({ message: 'Product added successfully.', product: newStock });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ message: 'Failed to add product.', error: error.message });
  }
};

// Update Stock
exports.updateStock = async (req, res) => {
  const { SId, manufacturerId, ...stockData } = req.body;

  try {
    const updatedStock = await StocksService.updateStock(SId, manufacturerId, stockData);

    return res.status(200).json({ message: 'Stock updated successfully.' });
  } catch (error) {
    console.error('Error updating Stock:', error);
    return res.status(500).json({ message: 'Failed to update Stock.', error: error.message });
  }
};

// Get Stock Details by Manufacturer
exports.getStockDetailsByManufacturer = async (req, res) => {
  const { manufacturerId } = req.params;

  try {
    const stockDetails = await StocksService.getStockDetailsByManufacturer(manufacturerId);

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
