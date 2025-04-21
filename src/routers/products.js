const router = require('express').Router()
const productsc = require('../controllers/products')
const {verifyToken} = require('../middlewares/auth')

//console.log(productsc);
router.get('/get-products',verifyToken,productsc.getproducts)
router.get('/get-manufacturer-products/:manufacturerId',verifyToken,productsc.getAllProductsByManufacturerId)
router.get('/get-productDetails/:PId',verifyToken,productsc.getProductDetails)
router.post('/add-product',verifyToken,productsc.addProduct)
router.post('/update-product',verifyToken,productsc.updateProduct)
router.post('/bulk-product-update',verifyToken,productsc.bulk_product_update)
router.get('/product-card-data',verifyToken,productsc.product_page_data)
router.get('/get-upload-error',productsc.get_upload_error)

module.exports =router