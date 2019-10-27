import * as Yup from 'yup';
import Enrollment from '../models/Enrollment';

class EnrollmentController {
  async store(req, res) {
    return res.json({ ok: true });
  }
}

export default new EnrollmentController();
