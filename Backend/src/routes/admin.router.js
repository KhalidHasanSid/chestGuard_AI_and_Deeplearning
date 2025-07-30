import {adminRegisterController, loginAdminController,logoutController , sendCode, checkOTP,updatePassword, 
    approveQuestion ,getapprovedQuestionController,deleteQuestion,getInsights } from "../controllers/admin.controller.js";
import { Router } from "express";

import auth from "../middlewares/auth.middleware.js";

const adminRouter= Router();

adminRouter.route("/adminRegistration").post(adminRegisterController) 
adminRouter.route("/AdminloginFYP").post(loginAdminController)
// adminRouter.route("/auth").post(auth,authchecker)  

adminRouter.route("/logOutFYP").post(auth, logoutController)
adminRouter.route("/sendcode").post(sendCode)  
adminRouter.route("/checkOTP").post(checkOTP)
adminRouter.route("/setPassword").post(updatePassword)
adminRouter.route("/A").post(approveQuestion )
adminRouter.route("/B").get(getapprovedQuestionController)
adminRouter.route("/getInsights").get(getInsights)

adminRouter.route("/deletequestion").post(deleteQuestion)








export default  adminRouter
