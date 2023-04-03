const bcrypt = require('bcryptjs');
const User = require('../schema/userSchema')
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const register = async (req, res) => {
  const { password, phoneNumber, dateOfBirth, cvv, expirationDate } = req.body;

  if (!password) {
    return res.status(400).json({ msg: "incomplete credentials" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedpass = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(40).toString("hex");

    const user = await User.create({
      ...req.body,
      cvv: Number(cvv),
      expirationDate: new Date(expirationDate),
      dateOfBirth: new Date(dateOfBirth),
      phoneNumber: Number(phoneNumber),
      password: hashedpass,
      verificationToken,
    });

    if (!user) {
      return res
        .status(400)
        .json({ msg: "Something went wrong. Please try again" });
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.USER,
        pass: process.env.PASS,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
    });

    await transporter.sendMail({
      from: '"charity Org" <charityapplicationmail@gmail.com>',
      to: `${user.email}`,
      subject: "CharityOrg: Account verification:",
      html: `
                <h3>Hello ${user.firstName}</h3>
                <h4>Welcome to Charity.Org</h4>
                <p>You are almost done. Kindly verify your account</p>
                <a
                style="background-color:tomato; color:white; padding: 5px; margin:10px 0px 10px 0px; text-decoration:none;" 
                href="https://charityorg.vercel.app/verify?email=${user.email}&verificationToken=${user.verificationToken}"
                >
                Verify account
                </a>`,
    });

    return res
      .status(200)
      .json({ msg: "success! we sent you an email to verify your account" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { verificationToken, email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ msg: "No user with this email. Please try registering" });
    }

    if (user.verificationToken !== verificationToken) {
      return res.status(400).json({ msg: "false or expired token" });
    }

    user.isVerified = true;
    user.verified = Date.now();
    user.verificationToken = "";
    await user.save();
    const { _id, firstName, lastName, phoneNumber, isVerified } = user;
    return res.status(200).json({
      msg: "email verified",
      user: {
        _id,
        email: user.email,
        firstName,
        lastName,
        phoneNumber,
        isVerified,
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const login = async (req, res) => {
  const { password, email } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: "Incomplete credentials" });
  }
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ msg: "This user does not exist. Try registering" });
    }

    const isPassCorrect = await bcrypt.compare(password, user.password);

    if (isPassCorrect) {
      if (user.isVerified) {
        const { _id, email, firstName, lastName, phoneNumber, isVerified } =
          user;
        return res.status(200).json({
          msg: "success",
          user: { _id, email, firstName, lastName, phoneNumber, isVerified },
        });
      } else {
        return res.status(400).json({ msg: "Please verify your email" });
      }
    } else {
      return res.status(400).json({ msg: "wrong email or password" });
    }
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }
};

module.exports = { login, register, verifyEmail };

cardNumber: 454845407;
cvv: 457;
dateOfBirth: "1991-03-25T15:08:59.000Z";
email: "concordchucks2@gmail.com";
expirationDate: "2023-03-25T15:08:59.000Z";
firstName: "Young";
isVerified: true;
lastName: "D";
password: "$2a$10$Ce5UsAOyijbkkja1/3DmZeW827tgVT07sB5hRDDV1h2sdAoyrSBh6";
phoneNumber: 234;
promoCode: "sfdsfsd";
verificationToken: "";
verified: "2023-03-25T15:13:58.039Z";
__v: 0;
_id: "641f0f77d0331a88b8e371f1";