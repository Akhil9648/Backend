import { v2 as cloudinary} from "cloudinary";
import fs from fs
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY, 
});
const uploadonCloudinary= async(localFilePath)=>{
    try {
        if(!localFilePath) return;
        const responce =await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        })
        console.log("File is Uploaded on CLoudinary",responce.url);
        return responce;
    } catch (error) {
        fs.unlinkSync(localFilePath) //Remove the locally saved file as upload operation got failed
        return null;
    }
}
export {uploadonCloudinary};