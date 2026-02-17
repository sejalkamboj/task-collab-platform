import express from 'express';
import {
  createList,
  updateList,
  deleteList,
  updateListPosition
} from '../controllers/listController.js';
import { 
  validate, 
  createListSchema, 
  updateListSchema 
} from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createListSchema), createList);
router.patch('/:id', validate(updateListSchema), updateList);
router.delete('/:id', deleteList);
router.patch('/:id/position', validate(updateListSchema), updateListPosition);

export default router;
