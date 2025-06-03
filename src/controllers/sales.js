const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const Op = db.Op;
const SalesService = require('../services/sales');

exports.search_product = async (req,res) => {
    try {
        const data = {...req.user,...req.query}
        const sales = await SalesService.search_product(data);
    
        // if (!distributor) {
          return res.status(sales?.status || 200).json(sales);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error fetching search_product:", error);
        return res.status(500).json({ status:message.code500,message: error.message });
      }
};

exports.create_party = async (req,res) => {
    try {
        const data = {...req.user}
        const sales = await SalesService.create_party(data,req.body);
    
        // if (!distributor) {
          return res.status(sales?.status || 200).json(sales);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error fetching create_party:", error);
        return res.status(500).json({ status:message.code500,message: error.message });
      }
};

exports.get_party_list = async (req,res) => {
    try {
        const data = {...req.user,...req.query}
        const sales = await SalesService.get_party_list(data);
    
        // if (!distributor) {
          return res.status(sales?.status || 200).json(sales);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error fetching get_party_list:", error);
        return res.status(500).json({ status:message.code500,message: error.message });
      }
};

exports.create_sales = async (req,res) => {
    try {
        const data = {...req.user}
        const sales = await SalesService.create_sales(data,req.body);
    
        // if (!distributor) {
          return res.status(sales?.status || 200).json(sales);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error fetching create_sales:", error);
        return res.status(500).json({ status:message.code500,message: error.message });
      }
};

exports.get_sales = async(req,res) => {
    try {
        const data = {...req.user,...req.query}
        const sales = await SalesService.get_sales(data);
    
        // if (!distributor) {
          return res.status(sales?.status || 200).json(sales);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error fetching get_sales:", error);
        return res.status(500).json({ status:message.code500,message: error.message });
      }
}
exports.sales_details = async(req,res) => {
    try {
        const data = {...req.user,...req.query}
        const sales = await SalesService.sales_details(data);
    
        // if (!distributor) {
          return res.status(sales?.status || 200).json(sales);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error fetching sales_details:", error);
        return res.status(500).json({ status:message.code500,message: error.message });
      }
}