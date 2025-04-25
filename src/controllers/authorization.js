const message = require('../helpers/message')
const AuthService = require('../services/authorizationService');

exports.distributer_auth_request = async (req, res) => {
    try {
        const data = {...req.user,...req.body}
        const auth = await AuthService.distributer_auth_request(data);
        return res.status(auth?.status || 200).json(auth);
      } catch (error) {
        console.error("distributer_auth_request Error:", error.message);
        return res.status(500).json({ status:message.code500,message: error.message });
      }
}

exports.auth_request_list = async (req, res) => {
  try {
      const data = {...req.user,...req.query}
      const auth = await AuthService.auth_request_list(data);
      return res.status(auth?.status || 200).json(auth);
    } catch (error) {
      console.error("auth_request_list Error:", error.message);
      return res.status(500).json({ status:message.code500,message: error.message });
    }
}
exports.distributor_auth_request_list = async (req, res) => {
  try {
      const data = {...req.user,...req.query}
      const auth = await AuthService.distributor_auth_request_list(data);
      return res.status(auth?.status || 200).json(auth);
    } catch (error) {
      console.error("distributor_auth_request_list Error:", error.message);
      return res.status(500).json({ status:message.code500,message: error.message });
    }
}

exports.auth_distributer_summary = async (req, res) => {
  try {
      const data = {...req.user,...req.query}
      const auth = await AuthService.auth_distributer_summary(data);
      return res.status(auth?.status || 200).json(auth);
    } catch (error) {
      console.error("auth_distributer_summary Error:", error.message);
      return res.status(500).json({ status:message.code500,message: error.message });
    }
}
exports.auth_page_card_data_distributor = async (req, res) => {
  try {
      const data = {...req.user,...req.query}
      const auth = await AuthService.auth_page_card_data_distributor(data);
      return res.status(auth?.status || 200).json(auth);
    } catch (error) {
      console.error("auth_page_card_data_distributor Error:", error.message);
      return res.status(500).json({ status:message.code500,message: error.message });
    }
}

exports.stop_po = async (req, res) => {
  try {
      const data = {...req.user,...req.body}
      const auth = await AuthService.stop_po(data);
      return res.status(auth?.status || 200).json(auth);
    } catch (error) {
      console.error("stop_po Error:", error.message);
      return res.status(500).json({ status:message.code500,message: error.message });
    }
}

exports.update_auth_request = async (req, res) => {
  try {
      const data = {...req.user,...req.query}
      const auth = await AuthService.update_auth_request(data);
      return res.status(auth?.status || 200).json(auth);
    } catch (error) {
      console.error("update_auth_request Error:", error.message);
      return res.status(500).json({ status:message.code500,message: error.message });
    }
}

exports.authorizedBy_users = async (req,res) => {
  try {
    const data = {...req.user,...req.query}
    const auth = await AuthService.authorizedBy_users(data);

    return res.status(auth?.status || 200).json(auth);
  } catch (error) {
    console.error('Error authorizedBy_users:', error);
    return res.status(500).json({status:500, message:error.message });
  }
}