import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';

import Mail from '../../lib/Mail';

class EnrollmentMail {
  get key() {
    return 'EnrollmentMail';
  }

  async handle({ data }) {
    const { enrollment } = data;

    console.log('A fila executou');

    await Mail.sendMail({
      to: `${enrollment.student.name} <${enrollment.student.email}>`,
      subject: 'Matrícula realizada',
      template: 'enrollment',
      context: {
        student: enrollment.student.name,
        duration: enrollment.plan.duration,
        plan: enrollment.plan.title,
        price: enrollment.price.toFixed(2).replace('.', ','),
        date: format(parseISO(enrollment.end_date), 'dd/MM/yyyy', {
          locale: pt,
        }),
      },
    });
  }
}

export default new EnrollmentMail();
