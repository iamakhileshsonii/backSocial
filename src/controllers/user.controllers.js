import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// METHOD TO GENERATE ACCESSTOKEN & REFRESH TOKEN
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      `Something went wrong while generating Access & Refresh Tokens ||| ${error}`
    );
  }
};

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  // Get user details from frontend
  const { username, email, fullName, avatar, coverImage, password } = req.body;

  // Check if any field is empty
  if (
    [username, email, fullName, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required!!!");
  }

  // Check if user already exists
  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExist) {
    throw new ApiError(
      409,
      "User already exists with the provided username or email address"
    );
  }

  // Get local file paths
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  console.log(`AVATAR DATA :::::: ${avatarLocalPath}`);
  // Check if avatar is uploaded
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required!");
  }

  // Upload avatar and cover image on cloudinary
  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
  const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);

  // Check if avatar upload is successful
  if (!avatarUpload || !avatarUpload.url) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // Create user
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    avatar: avatarUpload.url,
    coverImage: coverImageUpload?.url || "",
    password: password,
  });

  // Find user by id and exclude sensitive information
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -accessToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  // Respond with success message and user details
  return res.status(201).json(
    new ApiResponse(200, {
      user: createdUser,
      message: "User created successfully",
    })
  );
});

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  // Get username, email, password from frontend
  // Check if user exists
  // Get user password
  // Check user password
  // Get response
  // Login user

  const { username, email, password } = req.body;

  // Check if username or email address is not empty
  if (!username || !email) {
    throw new ApiError(401, "Username or Email is required!!!");
  }

  // Check if the user is already exists
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(401, "User with Email or Username doesn't exist!!!");
  }

  // Check if password is valid
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password!!!");
  }

  // Generate refresh & access token
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

// LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged Out!!!"));
});

// REFRESH ACCESS TOKEN
const refreshAccessToken = asyncHandler(async (req, res) => {
  // GENERATE NEW ACCESS TOKEN

  // Get access token from cookie or body
  // Check incoming token from cookie or body with token in database
  // If user._id not found with incoming token ------ Invalid token
  // If incoming token doesn't matches user token ----- Token Expired || Changed

  try {
    const incomingRefresh = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefresh) {
      throw new ApiError(401, "Unauthorized request!!!");
    }

    const decodedToken = jwt.verify(
      incomingAccessToken,
      process.env.ACCESS_REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Unauthorized request!!!");
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefereshTokens(user);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refreshed!!!"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Something went wrong while refreshing access token!!!"
    );
  }
});

// UPDATE PASSWORD
const updateUserPassword = asyncHandler(async (req, res) => {
  // Get oldpassword, newpassword from body
  // Get the user from auth middleware ----- Currently the user is logged in ---- req.user._id
  // Check the oldpassword with user password existing in database
  // Update the new password in user password field in database
  // Save ---- user(collectionName).save({validationBeforeSave: false})

  const { oldpassword, newpassword } = req.body;

  const user = User.findById(req.user?._id);

  const checkPassword = user.isPasswordCorrect(oldpassword);

  if (!checkPassword) {
    throw new ApiError(401, "Password is invalid");
  }

  user.password = newpassword;

  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

// GET CURRENT USER
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// UPDATE ACCOUNT DETAIL
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName } = req.user;

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullName: fullName },
    },
    {
      new: true,
    }
  ).select("-password");

  if (!user) {
    throw new ApiError(401, "Unauthorized user");
  }

  return res.status(200).json(200, user, "User detail updated successfully");
});

// UPDATE AVATAR IMAGE
const updateAvatar = asyncHandler(async (req, res) => {
  const localFilePath = req.file?.path;

  if (!localFilePath) {
    throw new ApiError(401, "Local File Path is not provided!!!");
  }

  const uploadNewAvatar = await uploadOnCloudinary(localFilePath);

  if (!uploadNewAvatar.url) {
    throw new ApiError(
      401,
      "Something went wrong while uploading new avatar!!!"
    );
  }

  const updateAvatar = User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: uploadNewAvatar.url } },
    { new: true }
  );

  if (!updateAvatar) {
    throw new ApiError(
      401,
      "Something went wrong while updating new avatar!!!"
    );
  }

  return res.status(200).json(200, updateAvatar, "Avatar updated Successfully");
});

// UPDATE COVER IMAGE
const updateCoverImage = asyncHandler(async (req, res) => {
  const localFilePath = req.file?.path;

  const newCoverImage = await uploadOnCloudinary(localFilePath);

  if (!newCoverImage) {
    throw new ApiError(401, "Something went wrong while uploading");
  }

  const updateCoverImage = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImage: newCoverImage.url },
    },
    { new: true }
  );

  if (!updateCoverImage) {
    throw new ApiError(401, "Something went wrong while updating converImage");
  }

  return res
    .status(200)
    .json(200, updateCoverImage, "CoverImage updated successfully");
});

// CHANNEL DETAILS
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // Get username from url
  // Use $match to find the user in $user collection
  // Find the no. subscribers, subscribed accounts by the channel, isSubscribed
  // Return response

  const { username } = req?.params;

  if (!username) {
    throw new ApiError(401, "Username is not provided!!! ");
  }

  const channel = User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    //Subscriber
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    // SubscribedTo ------ (For: No. of channels subscribed by the)
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        $subscribersCount: {
          $size: "$subscribers",
        },
        $subscribedToCount: {
          $size: "$subscribedTo",
        },
        $isSubscribed: {
          $con: {
            $if: { $in: [req.user._id, "$subscriber.subscriber"] },
            $then: true,
            $else: false,
          },
        },
      },
    },
  ]);

  if (!channel.length) {
    throw new ApiError(404, "Channel not found!!!");
  }

  return res
    .status(200)
    .json(200, channel, "Channel information fetched successfully");
});

// GET USER WATCH HISTORY
const getUserWatchHistory = asyncHandler(async (req, res) => {
  const watchHistory = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              $project: {
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
              },
            },
          },
        ],
      },
      $project: {
        videoFile: 1,
        thumbnail: 1,
        owner: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
      },
    },
  ]);

  if (!watchHistory) {
    throw new ApiError(401, "Unable to fetch watch history!!!");
  }

  return res
    .status(200)
    .json(200, watchHistory, "Watch history fetched successfully");
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateUserPassword,
  updateCoverImage,
  updateAvatar,
  updateAccountDetails,
  getUserChannelProfile,
  getUserWatchHistory,
};
