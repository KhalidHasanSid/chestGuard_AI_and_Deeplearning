import {v2 as cloudinary} from 'cloudinary'
import fs  from 'fs'

cloudinary.config({ 
    cloud_name: 'dugxmxdsb', 
    api_key: '226315526672389', 
    api_secret: 'az-S8lXDVrQAHpjSSTupYsizOBM' 
});


const uploadCloudinary= async (filePath)=>{
    try
    {  
        // console.log("ho")
     if(!filePath) return "no file in the file path"
    //  console.log("ho")

     const response = await cloudinary.uploader
     .upload(
         filePath )
            
    // console.log("succesfully uploaded  ",response)
    return response;}

    catch(err){
        // console.log(err)
        fs.unlinkSync(filePath)
    return null;

    }
    }

    export default uploadCloudinary