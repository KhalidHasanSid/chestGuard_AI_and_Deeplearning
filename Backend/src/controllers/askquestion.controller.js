import apiResponse from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js ";
import User from "../models/user.model.js";
import AskQuestion from "../models/questions.model.js";

const askQuestionController = asyncHandler(async (req, res, next) => {
    console.log("=====================;sdvnsdblsbvsnhdboihsfbnsfbldsb kosbns ")

  const { age, city, problem, description } = req.body
  console.log(age, "ugyufyutfct", city, "===", problem, "===", description)

  if (!age || !city || !problem || !description) { throw new apiError(401, "missing any value") }

 

  const user = req.user

  console.log("..........p", user)

  console.log("=====================")





  const new_queston = await AskQuestion.create({ age: age, city: city, Problem_title: problem, Description: description, user: user._id })
  res.json(new apiResponse(200, new_queston, "sucussfullySubmitted"))






})


const getQuetionsAsked = asyncHandler(async (req, res) => {

  try {
    const data = await AskQuestion.find({ Aproved: { $exists: false } }).lean()
    if (data.length === 0) {
      throw new apiError(404, "No data found ")
    }

    console.log(data)


    return res.status(201).json(
      new apiResponse(200, data, "data found")
    )

  }
  catch (error) {
    console.log("Error?", error)
    return res.status(500).json(
      new apiResponse(500, null, "Internal server error")
    )
  }

})

const authchecker = asyncHandler((req, res) => {
  console.log("auth is working fine ")
})



export { askQuestionController, getQuetionsAsked, authchecker }