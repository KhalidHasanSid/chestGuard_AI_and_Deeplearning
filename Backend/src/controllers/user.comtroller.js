import apiResponse from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js ";
import User from "../models/user.model.js";
import auth from "../middlewares/auth.middleware.js";
import transporter from "../utils/nodemailer.js";
import Patient from "../models/patient.model.js";
//import { setEmail,getemail,popemail } from "../utils/saveCurrentEmail.js";



//globalVariable 
let randomNumber = 0


const registerController = asyncHandler(async (req, res, next) => {
  const { MR_no, fullname, email, Age, gender, city } = req.body

  if (!MR_no || !fullname || !email || !Age || !city || !gender) { throw new apiError(400, "you miss a variable") }



  console.log("hi", MR_no, fullname, email, typeof (MR_no));



  const existPatient = await Patient.findOne({ MR_no: MR_no })

  console.log("about this patient ", existPatient)

  if (existPatient) {
    console.log("]]]]]]]]]]]]]]]]]]]", existPatient)
    throw new apiError(399, "patient already exist")
  }


  const newPatient = await Patient.create({
    MR_no: MR_no,
    fullName: fullname,
    email: email,
    age: Age,
    gender: gender,
    city: city



  })
  console.log("------------------------------------------------------")
  console.log(newPatient)


  const chk_newPatient = await Patient.findById(newPatient._id)
  if (!chk_newPatient) { throw new apiError(409, "something went wrong while registration") }





  res.json(new apiResponse(200, chk_newPatient, "successsfull"))


})

const getPatient = asyncHandler(async (req, res) => {
  console.log("9999999999999999999999999999")
  console.log("i AM HERE")
  const MR_no = req.params.MR_no

  console.log(MR_no)

  if (!MR_no) { throw new apiError(409, "mrno  not found") }

  const patient = await Patient.findOne({ MR_no: MR_no })
  console.log(patient)

  if (!patient) { throw new apiError(400, "patient not found ") }


  res.json(new apiResponse(200, patient, "patient found!"))


})

const SendEmail = asyncHandler(async (req, res) => {
  let information = ""
  console.log("=================NNNNN====")
  const { _id, password } = req.body
  console.log("ID,PASS", _id, password)

  if (!_id || !password) { throw new apiError(410, "something missing") }

  console.log("//////////")

  const patient = await Patient.findById(_id)
  console.log(patient)

  if (!patient) { throw new apiError(400, "patient not  exist ") }

  patient.password = password

  const chk = await patient.save({ validateBeforeSave: false })
  console.log("...", chk)

  const mailData = {
    from: 'khalidhassan.kh705@gmail.com',  // sender address
    to: patient.email,   // list of receivers
    subject: 'Sending Email using Node.js',
    text: `That was easy ${randomNumber}`,
    html: `<b>Hey there! </b>  your id: ${patient.MR_no}   and password: ${password} `

  };
  transporter.sendMail(mailData, function (err, info) {
    if (err) {
      console.log("////////////////////////////")
      console.log(err)
      throw new apiError(400, "hahahahahaahhah")
    }
    //  res.json (new apiResponse(400,email,"email  not send "))}
    else
      console.log(info);
    information = info

  });

  res.json(new apiResponse(200, information, "email send "))








})

const loginUserController = asyncHandler(async (req, res, next) => {

  const { MR_no, password } = req.body

  console.log(MR_no, "password", password)

  if (!MR_no || !password) { throw new apiError(400, "something missing") }


  const patient = await Patient.findOne({ MR_no })

  if (!patient) { throw new apiError(400, "user does not in the database") }

  console.log(Boolean(patient))

  let ok = false
  ok = await patient.validatePassword(password)
  console.log(Boolean(ok));

  if (!ok) { throw new apiError(400, "password is incorrect") }


  console.log("welcome you ate login ")
  const ACCESSTOKEN = await patient.generateAccessToken(patient._id)
  const RefreshTOKEN = await patient.generateRefreshToken(patient._id)

  if (!RefreshTOKEN) { throw new apiError(400, "no refresh token found ") }
  patient.refresh_token = RefreshTOKEN
  await patient.save({ validateBeforeSave: false })
  console.log("accestoken", ACCESSTOKEN, "\nRefresh token", RefreshTOKEN)



  res.cookie("accessToken", ACCESSTOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }).cookie("Refresh", RefreshTOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }).json(new apiResponse(200, {
    access: ACCESSTOKEN,
    refresh: RefreshTOKEN
  }, "login successful"))

})

const logoutController = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refresh_token: 1 // this removes the field from document
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessTokens", options)
    .clearCookie("Refresh", options)
    .json(new apiResponse(200, {}, "User logged Out"))

})


const sendCode = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {

    throw new apiError(400, "hahahahahaahhah")
  }
  console.log("check kro..............", email)


  randomNumber = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;


  const mailData = {
    from: 'khalidhassan.kh705@gmail.com',  // sender address
    to: email,   // list of receivers
    subject: 'Sending Email using Node.js',
    text: `That was easy ${randomNumber}`,
    html: `<b>Hey there! </b> ${randomNumber}`

  };
  transporter.sendMail(mailData, function (err, info) {
    if (err) {
      console.log("////////////////////////////")
      console.log(err)
      throw new apiError(400, "hahahahahaahhah")
    }
    //  res.json (new apiResponse(400,email,"email  not send "))}
    else
      console.log(info);
    res.json(new apiResponse(200, email, "email send "))
  });
})


const checkOTP = asyncHandler(async (req, res) => {
  const { email, code } = req.body

  console.log(code, "===", randomNumber)
  if (code == randomNumber)

    res.json(new apiResponse(200, code, "now you can set your password"))
  else res.json(new apiResponse(400, email, "email  not send "))
}


)

const updatePassword = asyncHandler(async (req, res) => {

  const { email, newpassword } = req.body
  console.log(email, "lbvhilsuvhiwbvjvfgihovwbdvhidwb", newpassword)

  if (!email || !newpassword) { throw new apiError(401, "something missing ") }

  const user = await User.findOne({ email })

  if (!user) { throw new apiError(409, "user doesnot exist") }

  user.password = newpassword
  await user.save({ validateBeforeSave: false })
  res.json(new apiResponse(200, {}, "Password changed successfully"))
})






export { registerController, getPatient, SendEmail, loginUserController, logoutController, sendCode, checkOTP, updatePassword }