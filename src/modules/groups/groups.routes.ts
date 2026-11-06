import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { param } from '../../utils/params';
import * as groupsService from './groups.service';
import { addMemberSchema, createGroupSchema, patchGroupSchema } from './groups.schemas';

export const groupsRouter = Router();

groupsRouter.post('/groups', requireAuth, validateBody(createGroupSchema), async (req, res, next) => {
  try {
    const group = await groupsService.createGroup(req.userId!, req.body);
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
});

groupsRouter.get('/groups', requireAuth, async (req, res, next) => {
  try {
    const result = await groupsService.listGroups(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

groupsRouter.get('/groups/:groupId', requireAuth, async (req, res, next) => {
  try {
    const group = await groupsService.getGroup(req.userId!, param(req.params.groupId, 'groupId'));
    res.json(group);
  } catch (err) {
    next(err);
  }
});

groupsRouter.patch(
  '/groups/:groupId',
  requireAuth,
  validateBody(patchGroupSchema),
  async (req, res, next) => {
    try {
      const group = await groupsService.renameGroup(
        req.userId!,
        param(req.params.groupId, 'groupId'),
        req.body.name,
      );
      res.json(group);
    } catch (err) {
      next(err);
    }
  },
);

groupsRouter.post(
  '/groups/:groupId/members',
  requireAuth,
  validateBody(addMemberSchema),
  async (req, res, next) => {
    try {
      const member = await groupsService.addMemberByEmail(
        req.userId!,
        param(req.params.groupId, 'groupId'),
        req.body.email,
      );
      res.status(201).json(member);
    } catch (err) {
      next(err);
    }
  },
);

groupsRouter.delete('/groups/:groupId/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const force = req.query.force === 'true';
    await groupsService.removeMember(
      req.userId!,
      param(req.params.groupId, 'groupId'),
      param(req.params.userId, 'userId'),
      force,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
