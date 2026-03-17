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
      User.findById(payload.sub, function (err, user) {
        if (err) {
          return done(err, false);
        }
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
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
    function (username, password, cb) {
      return User.findOne({ username, password }, { password: 0 })
        .populate("employee")
        .then(async (user) => {
          if (!user) {
            const employeeUser = await User.findOne({
              username: username,
            })
              .populate("employee")
              .populate("branch")
              .exec();

            if (!employeeUser) {
              return cb(null, false, {
                message: "Incorrect email or password.",
              });
            }

            if (employeeUser?.employee.status !== "active") {
              return cb(null, false, {
                message: "Your account is not active.",
              });
            }

            if (employeeUser.status !== "active") {
              return cb(null, false, {
                message: "Your account is not active.",
              });
            }

            return cb(null, employeeUser, {
              message: "Logged in Successfully.",
            });
          }

          if (user.status !== "active") {
            return cb(null, false, {
              message: "Your account is not active.",
            });
          }

          return cb(null, user, {
            message: "Logged in Successfully.",
          });
        })
        .catch((err) => {
          return cb(err);
        });
    }
  )
);
