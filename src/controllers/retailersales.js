const message = require('../helpers/message');
const RetailerSalesService = require('../services/retailersales');



exports.searchMedicine = async (req,res) => {
    try {
        const data = {...req.query,...req.user}
        const Data = await RetailerSalesService.searchMedicine(data);
    
        // if (!distributor) {
          return res.status(Data?.status || 200).json(Data);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error searchMedicine:", error);
        return res.status(500).json({ status:message.code500,message:error.message });
      }
};

exports.create_sales_order = async (req,res) => {
  try {
      // const data = {...req.body,...req.user}
      const Data = await RetailerSalesService.create_sales_order(req.body,req.user);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error searchcreate_sales_orderMedicine:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};

exports.retailer_sales_orders = async (req,res) => {
  try {
      const data = {...req.query,...req.user}
      const Data = await RetailerSalesService.retailer_sales_orders(data);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error retailer_sales_orders:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};

exports.make_doctors_payment = async (req,res) => {
  try {
      const data = {...req.body,...req.user}
      const Data = await RetailerSalesService.make_doctors_payment(data);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error make_doctors_payment:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};