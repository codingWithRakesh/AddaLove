import {Router} from 'express';
import {
    createReport,
    getReports,
    deleteReport
} from '../controllers/report.controller.js';
import { verifyUser } from '../middlewares/user.middleware.js';

const router = Router();

router.route('/create').post(verifyUser, createReport);
router.route('/all').get(getReports);
router.route('/delete/:reportId').delete(verifyUser, deleteReport);

export default router;