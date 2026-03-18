const User = require("../models/user");
const Employee = require("../models/employee");
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const LocalStrategy = require("passport-local").Strategy;

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET,
    },
    function (payload, done) {
      User.findById(payload.sub).exec()
        .then(user => {
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        })
        .catch(err => {
          return done(err, false);
        });
    }
  )
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async function (username, password, cb) {
      try {
        const searchUsername = username ? username.trim() : "";
        // Try exact username search first (case-insensitive)
        let user = await User.findOne({ username: { $regex: new RegExp(`^${searchUsername}$`, 'i') } }).populate("employee").populate("branch").exec();

        if (!user) {
          // If not found by username, try searching by employee phone number
          const employee = await Employee.findOne({ phoneNumber: searchUsername }).exec();
          if (employee) {
            user = await User.findOne({ employee: employee._id }).populate("employee").populate("branch").exec();
          }
        }
        
        // If still not found, try searching by employee phone number but as a regex (to handle formats)
        if (!user && searchUsername.length >= 10) {
            const employee = await Employee.findOne({ phoneNumber: { $regex: searchUsername } }).exec();
            if (employee) {
                user = await User.findOne({ employee: employee._id }).populate("employee").populate("branch").exec();
            }
        }

        if (!user) {
          return cb(null, false, { message: "Username or Phone Number not found." });
        }

        let isMatch = false;
        const normalizedRole = user.userType ? user.userType.trim().toLowerCase() : "";
        
        // Roles that use OTP login (sentinel password bypass)
        const otpRoles = ["branch", "assistant_branch_manager", "branch_executive"];
        
        if (password === "no-password" && otpRoles.includes(normalizedRole)) {
          isMatch = true;
        } else {
          isMatch = await user.comparePassword(password);
        }

        if (!isMatch) {
          return cb(null, false, { message: "Invalid password for this user." });
        }

        if (user.status !== "active") {
          return cb(null, false, { message: "Your account is not active." });
        }

        if (user.employee && user.employee.status !== "active") {
          return cb(null, false, { message: "Your associated employee account is not active." });
        }

        return cb(null, user, { message: "Logged in Successfully." });
      } catch (err) {
        return cb(err);
      }
    }
  )
);
