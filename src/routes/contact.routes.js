import { Router } from 'express';

//controllers
import { handleCreateContact } from '../controllers/contact.controllers.js'

const router = Router();

router.post('/identify', handleCreateContact);

export default router;
