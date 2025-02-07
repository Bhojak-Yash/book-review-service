const message = require('../helpers/message')
const AuthService = require('../services/authorizationService');

exports.distributer_auth_request = async (req, res) => {
    try {
        const data = {...req.user,...req.body}
        const auth = await AuthService.distributer_auth_request(data);
        return res.json(auth);
      } catch (error) {
        console.error("distributer_auth_request Error:", error.message);
        return res.status(500).json({ status:message.code500,message: "Failed to update distributer", error: error.message });
      }
}