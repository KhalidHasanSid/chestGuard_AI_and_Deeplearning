import mongoose , { Schema }from 'mongoose'
import User from './user.model.js'
import Patient from './patient.model.js'



const askQuestionSchema =mongoose.Schema({

    

    age:{
        type:String,
        required: true 

    },

    city:{
        type:String,
        required: true 

    },
    Problem_title:{
        type:String,
        required: true 

    },
    Description:{
        type:String ,
        required: true 

    },
    Aproved :{
        type:Boolean,

    },
    Reply :{
        type:String,

    },
    patient:{
        type:Schema.Types.ObjectId,
        ref:"Patient"
     }


},{timestamps:true})

const AskQuestion= mongoose.model("AskQuestion",askQuestionSchema)

export default  AskQuestion