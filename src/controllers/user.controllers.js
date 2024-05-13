import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser, loginUser, logoutUser };
