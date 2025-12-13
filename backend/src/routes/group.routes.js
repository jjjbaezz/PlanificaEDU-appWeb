import { Router } from 'express';
import {
  createGroup,
  listGroups
} from '../controllers/group.controller.js';

const router = Router();



router.get('/', listGroups);
router.post('/', createGroup);







export default router;
