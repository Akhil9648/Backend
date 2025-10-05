import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from"../utils/ApiError.js"
import { ApiResponce } from "../utils/ApiResponce.js";
import {uploadonCloudinary} from "../utils/cloudinary.js"
import { User } from "../models/user.models.js"; 
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    // console.log("Files received:", req.files);
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)
    const coverImage = await uploadonCloudinary(coverImageLocalPath)
    // console.log("Files received:", req.files);
    console.log(avatar);
    console.log(coverImage);
    
    
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponce(200, createdUser, "User registered Successfully")
    )

} )
const loginUser= asyncHandler (async (req,res)=>{
    // req->body se data leke aao
    // usee username ya email ko database me match karo
    // Agr username mil jata hai to password ko decrypt karke match karlo
    // agr match to singin(access aur refresh token bhi) nhi to try again
    // send cookies and responce
    // Agr email nhi mila database me to signup ke liye bol do
    const {email,username,password}=req.body
    if(!(username || email)){
        throw new ApiError(400,"Username or email is required")
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User Does not exist")
    }
    const isPasswordvalid=await  user.isPasswordCorrect(password)
    if(!isPasswordvalid){
        throw new ApiError(401,"Invalid User Credentials!!");
    }
    const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id)
    const loggedUser=await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponce(
            200,
            {
                user:loggedUser,
                accessToken,
                refreshToken
            },
            "User Logged in Successfully"
        )
    )
})
const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
      refreshToken:1,
      } 
    },
      {
        new:true
      }
  )
  const options={
        httpOnly:true,
        secure:true
    }
  return res
  .status(201)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponce(200,{},"User logged Out"))
})
const refreshAcessToken= asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.
    refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unautherized Request")
    }
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET) 
        const user=await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        if(incomingRefreshToken!=-user.refreshToken){
            throw new ApiError(404,"Refresh Token is Expired or Used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken}=await generateAccessAndRefereshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponce(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access Toekn Refreshed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
        
    }
})
const changeCurrentUserPassword=asyncHandler(async(req,res)=>{
    const {oldpassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=user.isPasswordCorrect(oldpassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Password")
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new ApiResponce("Passowrd Changed Successfully"))
    })
    const getCurrentUser= asyncHandler(async(req,res)=>{
        return res
        .status(200)
        .json(200,req.user,"Current User Fetched Succesfully")
    })
    const updateAccountDetails= asyncHandler(async(req,res)=>{
        const {fullName,email}=req.body
        if(!fullName || !email){
            throw new ApiError(400,"All fields are Required")
        }
        const user=useReducer.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullName:fullName,
                    email:email
                }
            },
            {new :true}
        ).select("-password")
        return res
        .status(200)
        .json(new ApiResponce(200,user,"Account Details Updated Succesfully"))
    })
    const updateUserAvatar=asyncHandler(async(req,res)=>{
        const avatarLocalPath=req.file?.path
        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar File Missing")
        }
        const avatar=await uploadonCloudinary(avatarLocalPath)
        if(!avatar.url){
            throw new ApiError(400,"Error While uploading on Avatar")
        }
        const user=await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar:avatar.url
                }
            },
            {new:true}
        ).select("-password")
        return res
        .status(200)
        .json(new ApiResponce(200,user,"Avatar Image Updated Succcesfully"))
    })
    const updateUserCoverImage=asyncHandler(async(req,res)=>{
        const coverImageLocalPath=req.file?.path
        if(!coverImageLocalPath){
            throw new ApiError(400,"Cover Image Missing")
        }
        const coverImage=await uploadonCloudinary(coverImageLocalPath)
        if(!coverImage.url){
            throw new ApiError(400,"Error While uploading on Cover Image")
        }
        const user=await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage:coverImage.url
                }
            },
            {new:true}
        ).select("-password")
        return res
        .status(200)
        .json(new ApiResponce(200,user,"Cover Image Updated Succcesfully"))
    })
    const getUserChannelProfile=asyncHandler(async(req,res)=>{
        const {username}=req.params
        if(!username?.trim()){
            throw new ApiError(400,"Username is Missing");
        }
        const channel=await User.aggregate([
            {
                $match:{
                    username:username?.toLowerCase()
                },
            },
                {
                    $lookup:{
                        from:"subscriptions",
                        localField:"_id",
                        foreignField:"channel",
                        as:"subscribers"
                    }
                },
                {
                    $lookup:{
                        from:"subscriptions",
                        localField:"_id",
                        foreignField:"subscriber",
                        as:"subscribedTo"
                    }
                },
                {
                    $addFields:{
                        subscriberscount:{
                            $size:"$subscribers"
                        },
                        channelsSubscribedToCount:{
                            $size:"$subscribedTo"
                        },
                        isSubscribed:{
                            $cond:{
                                if: {$in:[req.user?._id,"$subscribers.subscriber"]},
                                then:true,
                                else: false
                            }
                        }
                    }
                },{
                    $project:{
                        fullName:1,
                        username:1,
                        subscriberscount:1,
                        channelsSubscribedToCount:1,
                        isSubscribed:1,
                        avatar:1,
                        coverImage:1,
                        email:1
                    }
                }
        ])
        if(!channel?.length){
            throw new ApiError(404,"Channel does not exist")
        }
        return res
        .status(200)
        .json(
            new ApiResponce(200,channel[0],"User Channel Fetched Successfully")
        )
    })
    const getWatchHistory=asyncHandler(async(req,res)=>{
        const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }
            ]
        }
    }
    ])
    return res
    .status(200)
    .json(new ApiResponce(
        200,
        user[0].watchHistory,
        "Watch History Fetched Successfully"
    ))
    })
export {registerUser,
    loginUser,logoutUser,
    refreshAcessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory,
    getUserChannelProfile
}