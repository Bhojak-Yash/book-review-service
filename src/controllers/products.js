const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const { verifyToken } = require('../middlewares/auth')
const ProductsService = require('../services/productsService');



// Add single product
exports.addProduct = async (req, res) => {
  try {
    const data = req.body
    const Product = await ProductsService.addProduct(data);

    // if (!distributor) {
      return res.status(Product?.status || 200).json(Product);
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching createRetailer:", error.message);
    return res.status(500).json({ status: message.code500, message: message.message500 });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const data = req.body
    const Product = await ProductsService.updateProduct(data);

    // if (!distributor) {
      return res.status(Product?.status || 200).json(Product);
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching createRetailer:", error.message);
    return res.status(500).json({ status: message.code500, message: message.message500 });
  }
};


exports.getAllProductsByManufacturerId = async (req, res) => {
  // console.log(req.params);
  try {
    const data = {...req.params,...req.query, ...req.user}
    const Product = await ProductsService.getAllProductsByManufacturerId(data);

    // if (!distributor) {
      return res.status(Product?.status || 200).json(Product);
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching createRetailer:", error.message);
    return res.status(500).json({ status: message.code500, message: message.message500 });
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const data = req.params
    const Product = await ProductsService.productDetails(data);

    // if (!distributor) {
      return res.status(Product?.status || 200).json(Product);
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching createRetailer:", error.message);
    return res.status(500).json({ status: message.code500, message: message.message500 });
  }
};


exports.getproducts = async (req, res) => {
  try {
    const data = req.body
    const Product = await ProductsService.getproducts(data);

    // if (!distributor) {
      return res.status(Product?.status || 200).json(Product);
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching createRetailer:", error.message);
    return res.status(500).json({ status: message.code500, message: message.message500 });
  }
}


exports.bulk_product_update = async (req, res) => {
  try {
    const data = req.body
    const Product = await ProductsService.bulk_product_update(data);

    // if (!distributor) {
      return res.status(Product?.status || 200).json(Product);
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching bulk_product_update:", error.message);
    return res.status(500).json({ status: message.code500, message: message.message500 });
  }
}
exports.product_page_data = async (req, res) => {
  try {
    const data = {...req.user}
    const Product = await ProductsService.product_page_data(data);

    // if (!distributor) {
      return res.status(Product?.status || 200).json(Product);
    // }
    
    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching product_page_data:", error.message);
    return res.status(500).json({ status: message.code500, message: message.message500 });
  }
}

exports.get_upload_error = async (req, res) => {
  try {
    const data = {...req.query}
    const Product = await ProductsService.get_upload_error(data);

    // if (!distributor) {
      return res.status(Product?.status || 200).json(Product);
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching product_page_data:", error.message);
    return res.status(500).json({ status: message.code500, message: message.message500 });
  }
}