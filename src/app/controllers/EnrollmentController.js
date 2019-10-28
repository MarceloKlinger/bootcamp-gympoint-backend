import * as Yup from 'yup';
import { addMonths, parseISO, isBefore } from 'date-fns';

import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Plan from '../models/Plan';

class EnrollmentController {
  async index(req, res) {
    const { page = 1, quantity = 20 } = req.params;

    const enrollment = await Enrollment.findAll({
      limit: quantity,
      offset: (page - 1) * quantity,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });

    return res.json(enrollment);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { student_id, plan_id, start_date } = req.body;

    const parsedDate = parseISO(start_date);

    // date in the past, student already registered
    if (isBefore(parsedDate, new Date())) {
      return res.status(400).json({ error: 'You cannot enroll in past dates' });
    }

    const enrollmentExists = await Enrollment.findOne({
      where: { student_id },
    });

    if (enrollmentExists) {
      return res
        .status(401)
        .json({ error: 'A enrollment with this student already exists' });
    }

    // Calculate price and date
    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { price: priceMonth, duration } = plan;

    const price = priceMonth * duration;
    const end_date = addMonths(parsedDate, duration);

    const enrollment = await Enrollment.create({
      ...req.body,
      price,
      end_date,
    });

    return res.json(enrollment);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { student_id, plan_id, start_date } = req.body;

    const parsedDate = parseISO(start_date);

    const { id } = req.params;

    const enrollment = await Enrollment.findByPk(id);

    if (student_id !== enrollment.student_id) {
      const studentEnrollmentExists = await Enrollment.findOne({
        where: { student_id },
      });

      if (studentEnrollmentExists) {
        return res
          .status(401)
          .json({ error: 'A enrollment with this student already exists' });
      }
    }

    // Calculate price and date
    const plan = await Plan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { price: priceMonth, duration } = plan;

    const price = priceMonth * duration;
    const end_date = addMonths(parsedDate, duration);

    await enrollment.update({
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    });

    await enrollment.save();

    return res.json(enrollment);
  }

  async delete(req, res) {
    const enrollment = await Enrollment.findByPk(req.params.id);

    if (!enrollment) {
      return res.status(401).json({ error: 'enrollment is not exist' });
    }

    await enrollment.destroy();

    return res.send();
  }
}

export default new EnrollmentController();
