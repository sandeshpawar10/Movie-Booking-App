const express = require("express")
const router = express.Router()
const controller = require("../controllers/userController")
const {verifyJWt} = require("../middlewares/authenticationMiddleware")
router.post('/user/register',controller.registerUser)
router.post('/user/login',controller.loginuser)
router.post('/user/logout', verifyJWt,controller.logoutuser)
router.get('/user/currentuser',verifyJWt,controller.getcurrentuser)
router.get('/user/verifyemail/:verificationToken',controller.verifyEmail)
router.post('/user/resendverifyemail',verifyJWt,controller.resendEmailVerification)
router.post('/user/refreshaccesstoken',controller.refreshaccesstoken)
router.post('/user/forgotpassword',controller.forgotPasswordFunction)
// router.get('/user/resetpassword/:resetToken', (req, res) => {
//     res.send("Reset password page (or redirect to frontend)");
// });
router.post('/user/resetpassword/:resetToken',controller.resetPasswordFunction)
router.post('/user/changecurrentpassword',verifyJWt,controller.changeCurrentPasswordFunction)

module.exports = router