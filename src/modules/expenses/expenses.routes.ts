import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { param } from '../../utils/params';
import * as expensesService from './expenses.service';
import { expenseBodySchema } from './expenses.schemas';

export const expensesRouter = Router();

expensesRouter.post(
  '/groups/:groupId/expenses',
  requireAuth,
  validateBody(expenseBodySchema),
  async (req, res, next) => {
    try {
      const expense = await expensesService.createExpense(
        req.userId!,
        param(req.params.groupId, 'groupId'),
        req.body,
      );
      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  },
);

expensesRouter.get('/groups/:groupId/expenses', requireAuth, async (req, res, next) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await expensesService.listExpenses(
      req.userId!,
      param(req.params.groupId, 'groupId'),
      includeDeleted,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

expensesRouter.get('/groups/:groupId/expenses/:expenseId', requireAuth, async (req, res, next) => {
  try {
    const expense = await expensesService.getExpense(
      req.userId!,
      param(req.params.groupId, 'groupId'),
      param(req.params.expenseId, 'expenseId'),
    );
    res.json(expense);
  } catch (err) {
    next(err);
  }
});

expensesRouter.patch(
  '/groups/:groupId/expenses/:expenseId',
  requireAuth,
  validateBody(expenseBodySchema),
  async (req, res, next) => {
    try {
      const expense = await expensesService.updateExpense(
        req.userId!,
        param(req.params.groupId, 'groupId'),
        param(req.params.expenseId, 'expenseId'),
        req.body,
      );
      res.json(expense);
    } catch (err) {
      next(err);
    }
  },
);

expensesRouter.delete(
  '/groups/:groupId/expenses/:expenseId',
  requireAuth,
  async (req, res, next) => {
    try {
      await expensesService.softDeleteExpense(
        req.userId!,
        param(req.params.groupId, 'groupId'),
        param(req.params.expenseId, 'expenseId'),
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
