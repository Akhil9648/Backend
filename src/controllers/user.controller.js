import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from"../utils/ApiError.js"
import { useReducer } from 'react';
import { ApiResponce } from "../utils/ApiResponce.js";
import {uploadonCloudinary} from "../utils/cloudinary.js"
const registerUser=asyncHandler(async (req,res)=>{
    // Procedure
    // User will input his/her details
    // validation-not empty
    // Check if user already exist:username,email
    // Check for image and avatar(If available upload them to cloudnary)
    // Create user object-create entry in DB
    // remove password and refresh token field from responce
    // Check for user creation
    // return responce
    const {fullName, email, username, password } = req.body
    console.log("email: ", email);
    if([fullName,email,username,password].some((field)=>
        field?.trim()==="")
    )   {
            throw new console.ApiError(400,"all fields are required");
        }
    const existingUser=username.findOne({
            $or:[{username},{email}]
        })
    if(existingUser){
        throw new ApiError(409,"User with Email or User already Exist")
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar=await uploadonCloudinary(avatarLocalPath)
    const coverImage=await uploadonCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(409,"User with Email or User already Exist")
    }
    User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something Went wrong while Registering the user")
    }
    return res.status(201).json(
        new ApiResponce(200, createdUser, "User Registered Sucessfully")
    )
    })
export {registerUser}