import * as Yup from 'yup';
import { addMonths, parseISO } from 'date-fns';

import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Plan from '../models/Plan';

import EnrollmentMail from '../jobs/EnrollmentMail';
import Queue from '../../lib/Queue';

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

    const { start_date, plan_id, student_id } = req.body;

    // Check if student exist
    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(400).json({ error: 'Student does not exists' });
    }

    const plan = await Plan.findByPk(plan_id);

    // Check if plan exist
    if (!plan) {
      return res.status(400).json({ error: 'Plan does not exists' });
    }

    const date = parseISO(start_date);

    const end_date = addMonths(date, plan.duration);

    console.log(plan.price);

    const enrollment = await Enrollment.create({
      start_date: date,
      end_date,
      price: plan.price,
      student_id,
      plan_id,
    });

    await Queue.add(EnrollmentMail, {
      enrollment: {
        plan,
        student,
        price: Number(plan.price),
        end_date: enrollment.end_date,
      },
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

    await Queue.add(EnrollmentMail.key, {
      enrollment,
    });

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
