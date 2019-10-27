import * as Yup from 'yup';
import Student from '../models/Student';

class StudentController {
  async index(req, res) {
    const { page = 1, quantity = 20 } = req.params;

    const students = await Student.findAll({
      limit: quantity,
      offset: (page - 1) * quantity,
    });

    return res.json(students);
  }

  async show(req, res) {
    const { id } = req.params;

    const student = await Student.findByPk(id);

    return res.json(student);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      age: Yup.number().required(),
      weight: Yup.number().required(),
      height: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const studentExists = await Student.findOne({
      where: {
        email: req.body.email,
        name: req.body.name,
      },
    });

    if (studentExists) {
      return res.status(400).json({ error: 'Student already exists.' });
    }
    const { id, name, email, age, weight, height } = await Student.create(
      req.body
    );

    return res.json({
      id,
      name,
      email,
      age,
      weight,
      height,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      age: Yup.number(),
      weight: Yup.number(),
      height: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { email } = req.body;
    const student = await Student.findOne({ where: { email } });

    if (!student) {
      res.status(401).json({ error: 'Student not found' });
    }

    const { id, name, age, weight, height } = await student.update(req.body);

    return res.json({
      id,
      name,
      age,
      weight,
      height,
    });
  }

  async delete(req, res) {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(401).json({ error: 'Student is not exist' });
    }

    await student.destroy();

    return res.send('Student is delete');
  }
}

export default new StudentController();
