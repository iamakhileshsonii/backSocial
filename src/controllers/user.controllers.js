import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResonse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });

  // Get user details from frontend
  // Check if the input fields are empty
  // Check if the user already exists
  // Check for cover image and avatar
  // Upload cover image and avatar on cloudinary
  // Create user object and insert them in database
  // Remove password and Token from object
  // Check for user creation
  // Get response

  const { username, email, fullName, avatar, coverImage } = req.body;
  console.log(
    `*********************************** \n Username: ${username} \n Email: ${email} \n Fullname: ${fullName} \n ***********************************`
  );

  // Check if any field is empty
  if (
    [username, email, fullName, avatar, coverImage].some(
      (field) => field.trim() === ""
    )
  ) {
    throw new apiError(400, "All fields are required");
  }

  // Check if user already exists
  const userExist = User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExist) {
    throw new apiError(
      409,
      "User already exist with username or email address"
    );
  }

  // Get local file path
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar is required!");
  }

  // Upload on cloudinary
  const Avatar = await uploadOnCloudinary(avatarLocalPath);
  const CoverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!Avatar) {
    throw new apiError(400, "Avatar is required!");
  }

  // Create user
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    avatar: Avatar.url,
    coverImage: CoverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -accessToken"
  );

  if (!createdUser) {
    throw new apiError(401, "Something went wrong while registering the user!");
  }

  return res
    .status(201)
    .json(new apiResonse(200, createdUser, "User created successfully"));
});

export { registerUser };
