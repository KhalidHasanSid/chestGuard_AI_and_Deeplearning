import { Router } from "express";
import {askQuestionController,getQuetionsAsked,authchecker} from "../controllers/askquestion.controller.js";
import auth from "../middlewares/auth.middleware.js";

const askQuestionRouter= Router();

askQuestionRouter.route("/askQuestionFYP").post(auth("patient"),askQuestionController) 


askQuestionRouter.route("/getquestions").get(getQuetionsAsked)

export default askQuestionRouter