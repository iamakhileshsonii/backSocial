import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

export { registerUser };
