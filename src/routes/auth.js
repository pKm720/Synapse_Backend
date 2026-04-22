import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' })
  return { accessToken, refreshToken }
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully registered
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body
    
    let user = await User.findOne({ email })
    if (user) throw new ApiError(400, 'User already exists')

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    user = await User.create({ email, passwordHash })

    const { accessToken, refreshToken } = generateTokens(user._id)
    user.refreshToken = refreshToken
    await user.save()

    res.status(201).json({ accessToken, refreshToken })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to get tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully authenticated
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    
    const user = await User.findOne({ email })
    if (!user) throw new ApiError(401, 'Invalid credentials')

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) throw new ApiError(401, 'Invalid credentials')

    const { accessToken, refreshToken } = generateTokens(user._id)
    user.refreshToken = refreshToken
    await user.save()

    res.json({ accessToken, refreshToken })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully refreshed
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new ApiError(401, 'Refresh token required')

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    
    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token')
    }

    const tokens = generateTokens(user._id)
    user.refreshToken = tokens.refreshToken
    await user.save()

    res.json(tokens)
  } catch (error) {
    console.error("DEBUG REFRESH ERROR:", error.message);
    next(new ApiError(401, `Refresh failed: ${error.message}`));
  }
})

router.post('/logout', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (user) {
      user.refreshToken = null
      await user.save()
    }
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
