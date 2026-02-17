import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email query param required' })

    const users = await prisma.user.findMany({
      where: { email: { contains: email, mode: 'insensitive' } },
      select: { id: true, name: true, email: true, avatar: true },
      take: 5,
    })

    res.json({ users })
  } catch (err) {
    next(err)
  }
})

export default router