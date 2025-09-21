import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from"../utils/ApiError.js"
import { ApiResponce } from "../utils/ApiResponce.js";
import {uploadonCloudinary} from "../utils/cloudinary.js"
import { User } from "../models/user.models.js"; 
const generateAccessandRefeshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSaved:false })
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating  Access and Refresh Token...")
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
    if(!username || !email){
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
    const {accessToken,refreshToken}=await generateAccessandRefeshTokens(user._id)
    const loggedUser=user.findById(user._id).select("-password -refreshToken")
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
      refreshToken:undefined,
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
export {registerUser,
    loginUser,logoutUser
}