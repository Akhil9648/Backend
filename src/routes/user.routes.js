import { Router } from "express";
import { changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAcessToken, registerUser, updateAccountDetails, updateUserAvatar } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { ApiResponce } from "../utils/ApiResponce.js";
const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  registerUser
);
userRouter.route('/login').post(loginUser)
// Sercured Routes
userRouter.route('/logout').post(verifyJWT,logoutUser)
userRouter.route('/refresh-token').post(refreshAcessToken)
userRouter.route('/change-password').post(verifyJWT,changeCurrentUserPassword)
userRouter.route('/current-user').get(verifyJWT,getCurrentUser)
userRouter.route('update-account').patch(verifyJWT,updateAccountDetails)
userRouter.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
userRouter.route('/cover-image').patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
userRouter.route('/c/:username').get(verifyJWT,getUserChannelProfile)
userRouter.route('/history').get(verifyJWT,getWatchHistory)

export default userRouter;