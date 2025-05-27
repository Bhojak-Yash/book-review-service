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
      return res.status(404).json({status:404, message: "Stock not found." });
    }

    return res.status(200).json({status:200, message: "Stock details retrieved successfully.", stock });
  } catch (error) {
    console.error("Error fetching Stock details:", error);
    return res.status(500).json({status:500, message: "Failed to retrieve Stock details.", error: error.message });
  }
};

// Add Stock
exports.addStock = async (req, res) => {
  const { ...stocksData } = req.body;
  const data = req?.user;
  let organisationId = stocksData.organisationId;

  try {
    const newStock = await StocksService.addStock(organisationId, stocksData, data);

    return res.status(201).json({status:201, message: 'Stock added successfully.', product: newStock });
  } catch (error) {
    console.error('Error adding Stock:', error);
    return res.status(500).json({status:500, message: 'Failed to add Stock.', error: error.message });
  }
};

// Update Stock
exports.updateStock = async (req, res) => {
  // const { SId, organisationId, ...stockData } = req.body;
  const { ...stockData } = req.body;
  const data = req?.user;

  let SId = stockData.SId;
  let organisationId = stockData.organisationId;

  try {
    const updatedStock = await StocksService.updateStock(SId, organisationId, stockData, data);

    return res.status(200).json({status:200, message: 'Stock updated successfully.' });
  } catch (error) {
    console.error('Error updating Stock:', error);
    return res.status(500).json({status:500, message: 'Failed to update Stock.', error: error.message });
  }
};

// Get Stock Details by Manufacturer
exports.getStockDetailsByManufacturer = async (req, res) => {
  const data = {...req.query,...req.user};


  try {
    const stockDetails = await StocksService.getStockDetailsByManufacturer(data);

    if (!stockDetails || stockDetails.length === 0) {
      return res.status(404).json({status:404, message: "Stock not found." });
    }
// console.log(stockDetails,';loioo')
    return res.status(200).json({
      status:200,
      message: "Stock details retrieved successfully.",
      apiData: stockDetails
    });
  } catch (error) {
    console.error("Error fetching Stock details:", error);
    return res.status(500).json({
      status:500,
      message: "Failed to retrieve Stock details.",
      error: error.message,
    });
  }
};

exports.getManufacturerStockSummary = async (req, res) => {
  try {
    const data = {...req.query, ...req.user};
    const stockDetails = await StocksService.getManufacturerStockSummary(data);

    if (!stockDetails || stockDetails.length === 0) {
      return res.status(404).json({status:404, message: "Stock not found." });
    }
// console.log(stockDetails,';loioo')
    return res.status(200).json({
      status:200,
      message: "Stock details retrieved successfully.",
      apiData: stockDetails
    });
  } catch (error) {
    console.error("Error fetching Stock details:", error);
    return res.status(500).json({
      status:500,
      message: "Failed to retrieve Stock details.",
      error: error.message,
    });
  }
};
exports.getdistributorStockSummary = async (req, res) => {
  try {
    const data = {...req.query, ...req.user};
    const stockDetails = await StocksService.getdistributorStockSummary(data);

    if (!stockDetails || stockDetails.length === 0) {
      return res.status(404).json({status:404, message: "Stock not found." });
    }
// console.log(stockDetails,';loioo')
    return res.status(200).json({
      status:200,
      message: "Stock details retrieved successfully.",
      apiData: stockDetails
    });
  } catch (error) {
    console.error("Error fetching Stock details:", error);
    return res.status(500).json({
      status:500,
      message: "Failed to retrieve Stock details.",
      error: error.message,
    });
  }
};


exports.getAllStocks = async (req, res) => {
  try {
    const userData = req.user;
    const params= req.query
    const data = {...userData,...params}
    const stockDetails = await StocksService.getAllStocks(data);

    if (!stockDetails || stockDetails.length === 0) {
      return res.status(404).json({status:404, message: "Stock not found." });
    }
// console.log(stockDetails,';loioo')
    return res.status(200).json({
      status:200,
      message: "Stock details retrieved successfully.",
      apiData: stockDetails
    });
  } catch (error) {
    console.error("Error fetching Stock details:", error);
    return res.status(500).json({
      status:500,
      message: "Failed to retrieve Stock details.",
      error: error.message,
    });
  }
};

