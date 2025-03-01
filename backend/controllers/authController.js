import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';
import { Op } from 'sequelize';


export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
user.resetTokenExpiry = expiry;

    user.resetToken = resetToken;
    user.resetTokenExpiry = expiry;
    await user.save();

    const resetLink = `http://localhost:5000/reset-password.html?token=${resetToken}`;
    const subject = 'Password Reset';
    const text = `You requested a password reset. Click here to reset:\n\n${resetLink}\n\nThis link is valid for 1 hour.`;
    console.log('Reset Link:', resetLink);
    const info = await sendEmail(user.email, subject, text);
    console.log('Nodemailer sendMail info:', info);
    res.json({
      message: 'Password reset link sent to your email',
      resetLink,  
      mailInfo: info 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
  export const resetPassword = async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const user = await User.findOne({
        where: {
          resetToken: token,
          resetTokenExpiry: { [Op.gt]: new Date() }
        }
      });
  
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
  
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
  
      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };