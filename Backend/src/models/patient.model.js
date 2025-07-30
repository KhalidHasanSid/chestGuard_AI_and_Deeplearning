import mongoose from "mongoose"
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const pateintSchema =new mongoose.Schema({
    MR_no:
    {
        type: String,
        unique:true,
        required:true,
        trim:true

    },
    fullName:
    {
        type: String,
        required:true,
        trim:true

    },
    email:
    {
        type: String,
       required:true,
        trim:true

    },
    age:
    {
        type: String,
        required:true,
       
        trim:true

    },
    gender:
    {
        type: String,
        required:true,
        trim:true

    },


    city:
    {
        type: String,
        required:true,
        trim:true

    }, 
    role:{
        type:String,
        default:"patient"
    },
    password:{
        type:String,
        
    }



},{timestamps:true})


pateintSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {return next();}
    this.password = await  bcrypt.hash(this.password, 10);
    next();
});

pateintSchema.methods.validatePassword= async function (password) {
   return  await  bcrypt.compare(password, this.password)
}

pateintSchema.methods.generateAccessToken=async function(){
     return  jwt.sign({_id:this._id},process.env.ACCESS_TOKEN_SECRET,{ expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
}
pateintSchema.methods.generateRefreshToken=async function(){
   return   jwt.sign({_id:this._id},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn:process.env.REFRESH_TOKEN_EXPIRY})
}


const Patient = mongoose.model("Patient",pateintSchema)
export default Patient