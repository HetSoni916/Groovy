const express = require('express');
const router = express.Router();
const {
  getAll, getById, create, update, remove, getStats,
} = require('../controllers/studentController');
const { validateCreateStudent, validateUpdateStudent } = require('../validators/studentValidator');
const authenticate = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/stats', getStats);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validateCreateStudent, create);
router.put('/:id', validateUpdateStudent, update);
router.delete('/:id', remove);

module.exports = router;
