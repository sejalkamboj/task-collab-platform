import { Response } from 'express';
import { BoardService } from '../services/boardService';
import { AuthRequest } from '../middleware/auth';

const boardService = new BoardService();

export const createBoard = async (req: AuthRequest, res: Response) => {
  try {
    const board = await boardService.createBoard(req.user!.userId, req.body);
    res.status(201).json(board);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserBoards = async (req: AuthRequest, res: Response) => {
  try {
    const boards = await boardService.getUserBoards(req.user!.userId);
    res.json(boards);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getBoardDetails = async (req: AuthRequest, res: Response) => {
  try {
    const board = await boardService.getBoardDetails(
      req.params.boardId,
      req.user!.userId
    );
    res.json(board);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const updateBoard = async (req: AuthRequest, res: Response) => {
  try {
    const board = await boardService.updateBoard(
      req.params.boardId,
      req.user!.userId,
      req.body
    );
    res.json(board);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteBoard = async (req: AuthRequest, res: Response) => {
  try {
    await boardService.deleteBoard(req.params.boardId, req.user!.userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    await boardService.addMember(
      req.params.boardId,
      req.user!.userId,
      req.body.email
    );
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
