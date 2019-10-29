import * as Yup from 'yup';

import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';

class HelpOrderController {
  async index(req, res) {
    const { page = 1, quantity = 20, id } = req.params;

    const helpOrder = await HelpOrder.findAll({
      where: { student_id: id },

      limit: quantity,
      offset: (page - 1) * quantity,
      attributes: ['id', 'question', 'answer'],
    });

    return res.json(helpOrder);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;
    const { question } = req.body;

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(400).json({ error: 'Student does not exists' });
    }

    const helpOrder = await HelpOrder.create({
      student_id: id,
      question,
    });

    return res.json(helpOrder);
  }
}

export default new HelpOrderController();
