const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const Employee = require("../../models/employee");
const otpService = require("../../services/otp");
const axios = require("axios");

function login(req, res, next) {
  console.log("login")
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        status: false,
        message: info ? info.message : "Invalid username or password.",
        data: {},
      });
    }

    req.login(user, { session: false }, (err) => {
      if (err) {
        return res.send(err);
      }

      if (user.loginMethod === "otp") {
        const otp = String(
          Math.floor(100000 + Math.random() * 900000)
        ).substring(0, 6);

        console.log("BYPASSING SMS: OTP for", user.employee?.phoneNumber, "is", otp);

        const token = jwt.sign(
          {
            sub: {
              user,
              otp,
            },
            iat: new Date().getTime(),
          },
          process.env.SECRET,
          { expiresIn: "5m" }
        );

        otpService.create({
          type: "employee",
          otp: otp,
          phoneNumber: user.employee?.phoneNumber,
        });

        return res.json({
          status: true,
          message: "OTP generated successfully (SMS bypassed).",
          data: { token },
        });

        /*
        axios
          .get(
            `https://pgapi.vispl.in/fe/api/v1/send?username=mkgold.trans&password=hhwGK&unicode=false&from=MKGOLD&to=${user.employee?.phoneNumber}&text=Hi.%20Your%20One%20Time%20Password%20to%20login%20MK%20Gold%20World%20is%20${otp}.%20This%20OTP%20is%20valid%20for%205%20minutes%20only.&dltContentId=1707168542360758659`
          )
          .then((data) => {
            if (
              data.data.statusCode == 200 &&
              data.data.state == "SUBMIT_ACCEPTED"
            ) {
              const token = jwt.sign(
                {
                  sub: {
                    user,
                    otp,
                  },
                  iat: new Date().getTime(),
                },
                process.env.SECRET,
                { expiresIn: "5m" }
              );

              otpService.create({
                type: "employee",
                otp: otp,
                phoneNumber: user.employee?.phoneNumber,
              });

              return res.json({
                status: true,
                message: "OTP sent successfully.",
                data: { token },
              });
            } else {
              return res.json({
                status: false,
                message: "OTP not sent",
                data: {},
              });
            }
          })
          .catch((err) => {
            return res.json({
              status: false,
              message: "OTP not sent",
              data: {},
            });
          });
          */
      } else {
        const token = jwt.sign(
          {
            sub: user._id,
            iat: new Date().getTime(),
          },
          process.env.SECRET
        );

        return res.json({
          status: true,
          message: "Logged in Successfully.",
          data: { user, token },
        });
      }
    });
  })(req, res, next);
}

function verifyLoginOtp(req, res, next) {
  if (!req.body.token) {
    return res.json({
      status: false,
      message: "Token is required.",
      data: {},
    });
  }
  if (!req.body.otp) {
    return res.json({
      status: false,
      message: "Otp is required.",
      data: {},
    });
  }

  jwt.verify(req.body.token, process.env.SECRET, function (err, decoded) {
    const data = decoded.sub;
    if (err) {
      return res.json({
        status: false,
        message: "Otp is expired.",
        data: {},
      });
    }

    if (String(data.otp) !== String(req.body.otp)) {
      return res.json({
        status: false,
        message: "Invalid otp.",
        data: {},
      });
    }

    const token = jwt.sign(
      {
        sub: data.user._id,
        iat: new Date().getTime(),
      },
      process.env.SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      status: true,
      message: "Logged in Successfully.",
      data: { user: data.user, token },
    });
  });
}

function getUserType(req, res, next) {
  const searchUsername = req.body.username ? req.body.username.trim() : "";
  User.findOne({ username: { $regex: new RegExp(`^${searchUsername}$`, 'i') } })
  .then(async function (user) {
      if (!user) {
        // Try exact phone number
        let employee = await Employee.findOne({
          phoneNumber: searchUsername,
        }).exec();

        // Try regex match for phone number if not found exactly
        if (!employee && searchUsername.length >= 10) {
            employee = await Employee.findOne({
                phoneNumber: { $regex: searchUsername },
            }).exec();
        }

        if (!employee) {
          return res.json({
            status: false,
            message: "Invalid username",
            data: [],
          });
        }

        const employeeUser = await User.findOne(
          {
            employee: employee._id,
          },
          { password: 0 }
        ).exec();

        if (!employeeUser) {
          return res.json({
            status: false,
            message: "Invalid username",
            data: [],
          });
        }

        return res.json({
          status: true,
          message: "",
          data: {
            userType: employeeUser.userType,
            loginMethod: employeeUser.loginMethod || "password",
          },
        });
      }
      return res.json({
        status: true,
        message: "",
        data: {
          userType: user.userType,
          loginMethod: user.loginMethod || "password",
        },
      });
    })
    .catch(function (err) {
      return res.json({
        status: false,
        message: "Invalid username",
        data: [],
      });
    });
}

function getBranchUser(req, res, next) {
  User.find({ username: req.body.username }, { employee: 1 })
    .populate("employee")
    .then(function (data) {
      return res.json({
        status: true,
        message: "",
        data: data,
      });
    })
    .catch(function (err) {
      return res.json({
        status: false,
        message: "Invalid username",
        data: [],
      });
    });
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).populate("employee").populate("branch");
    return res.json({
      status: true,
      message: "Profile retrieved",
      data: user,
    });
  } catch (err) {
    return res.json({
      status: false,
      message: err.message || "An error occurred while fetching profile",
      data: {},
    });
  }
}

async function updateProfile(req, res) {
  try {
    const { userId, employeeId, username, password, email, phoneNumber, alternatePhoneNumber } = req.body;
    console.log("--- UPDATE ATTEMPT START ---");
    console.log("IDs Received:", { userId, employeeId });
    console.log("Fields Received:", { username, email, phoneNumber });
    
    const targetUserId = userId || req.user?._id;
    if (!targetUserId) {
      console.log("ERROR: No User ID found in body or token");
      return res.json({ status: false, message: "User ID not provided" });
    }

    const user = await User.findById(targetUserId).populate("employee");
    if (!user) {
      console.log("ERROR: User not found in DB for ID:", targetUserId);
      return res.json({ status: false, message: "User not found" });
    }

    // Update User
    if (username) {
      console.log("Updating username from", user.username, "to", username);
      user.username = username;
    }
    if (password && user.loginMethod === "password") {
      console.log("Updating password...");
      user.password = password;
    }
    await user.save();
    console.log("User record SAVED");

    // Update Employee
    const targetEmployeeId = employeeId || user.employee?._id;
    if (targetEmployeeId) {
      const employee = await Employee.findById(targetEmployeeId);
      if (employee) {
        console.log("Updating employee details...");
        if (email) employee.email = email;
        if (phoneNumber) employee.phoneNumber = phoneNumber;
        if (alternatePhoneNumber) employee.alternatePhoneNumber = alternatePhoneNumber;
        await employee.save();
        console.log("Employee record SAVED");
      } else {
        console.log("WARNING: Linked employee not found for ID:", targetEmployeeId);
      }
    }

    console.log("--- UPDATE ATTEMPT SUCCESS ---");
    return res.json({
      status: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    console.log("--- UPDATE ATTEMPT FAILED ---");
    console.error(err);
    return res.json({
      status: false,
      message: err.message || "An error occurred while updating profile",
      data: {},
    });
  }
}

module.exports = { login, verifyLoginOtp, getUserType, getBranchUser, getProfile, updateProfile };
