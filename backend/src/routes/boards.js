import express from 'express';
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
} from '../controllers/boardController.js';
import { 
  validate, 
  createBoardSchema, 
  updateBoardSchema,
  addMemberSchema 
} from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBoards);
router.post('/', validate(createBoardSchema), createBoard);
router.get('/:id', getBoard);
router.patch('/:id', validate(updateBoardSchema), updateBoard);
router.delete('/:id', deleteBoard);

// Member management
router.post('/:boardId/members', validate(addMemberSchema), addMember);
router.delete('/:boardId/members/:userId', removeMember);

export default router;
