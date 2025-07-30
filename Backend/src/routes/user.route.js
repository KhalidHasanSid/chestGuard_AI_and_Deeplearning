import { Router } from "express";
import { registerController ,loginUserController,logoutController, getPatient ,SendEmail} from "../controllers/user.comtroller.js";
import auth from "../middlewares/auth.middleware.js";
import { sendCode,checkOTP, updatePassword } from "../controllers/user.comtroller.js";
;


const userRouter= Router()


userRouter.route("/registerFYP").post(registerController)
userRouter.route("/getPatients/:MR_no").get(auth("admin"),getPatient)
userRouter.route("/sendemail").post(auth("admin"),SendEmail)

userRouter.route("/loginFYP").post(loginUserController)  
 

userRouter.route("/logOutFYP").post(auth, logoutController)
userRouter.route("/sendcode").post(sendCode)  
userRouter.route("/checkOTP").post(checkOTP)
userRouter.route("/setPassword").post(updatePassword)






export default userRouter














