import user from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const registerUser = async (req, res) => {
  try {

    const { department, email, password, } = req.body;
    if (!department || !email || !password) {
      return res.status(400).json({
        message: "Please fill all the fields"
      });
    }

    const existingUser = await user.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    };

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new user({
      department: req.body.department,
      email: req.body.email,
      password: hashedPassword,
      role: "employee"
    });

    await newUser.save();
    res.status(201).json(newUser);
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const tokenGenerate = (userId, role) => {

  const accessToken = jwt.sign(
    { userId: userId, role: role },
    process.env.ACCESS_TOKEN,
    { expiresIn: "20m" }
  );

  const refreshToken = jwt.sign(
    { userId: userId },
    process.env.REFRESH_TOKEN,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/"
});

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "please fill all the fields"
      });
    }

    const existingUser = await user.findOne({ email: req.body.email });
    if (!existingUser) {
      return res.status(400).json({
        message: "User does not exist"
      });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const { accessToken, refreshToken } = tokenGenerate(existingUser._id, existingUser.role);

    existingUser.accessToken = accessToken;
    existingUser.refreshToken = refreshToken;

    await existingUser.save();

    res.cookie("refreshToken", refreshToken, {
      ...getRefreshCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token needed"
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);

    const existingUser = await user.findById(decoded.userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (existingUser.refreshToken !== refreshToken) {
      res.clearCookie("refreshToken", getRefreshCookieOptions());

      return res.status(403).json({
        success: false,
        message: "Invalid refresh token or token expired"
      });
    }

    const newAccessToken = jwt.sign(
      { userId: existingUser._id.toString(), role: existingUser.role },
      process.env.ACCESS_TOKEN,
      { expiresIn: "20m" }
    );

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });

  } catch (err) {
    res.status(403).json({
      success: false,
      message: "Invalid or expired refresh token"
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found"
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
    }
    catch (err) {
      res.clearCookie("refreshToken", {
        ...getRefreshCookieOptions()
      });
      return res.status(403).json({
        success: false,
        message: "invalid refresh token or token expired"
      });
    }

    const userId = decoded.userId;
    const checkUser = await user.findById(userId);
    if (!checkUser) {
      return res.status(404).json({
        success: false,
        message: "user not found"
      })
    }

    if (checkUser.refreshToken !== refreshToken) {
      res.clearCookie("refreshToken", {
        ...getRefreshCookieOptions()
      });
      return res.status(403).json({
        success: false,
        message: "invalid refresh token"
      });
    }
    checkUser.refreshToken = null;
    await checkUser.save();
    res.clearCookie("refreshToken", getRefreshCookieOptions());

    res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {
    console.log("Logout Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const registerfacilitymanager = async (req, res) => {
  try {

    const { department, email, password, } = req.body;
    if (!department || !email || !password) {
      return res.status(400).json({
        message: "Please fill all the fields"
      });
    }

    const existingUser = await user.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    };

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new user({
      department: req.body.department,
      email: req.body.email,
      password: hashedPassword,
      role: "facility_manager"
    });

    await newUser.save();
    res.status(201).json(newUser);
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
}