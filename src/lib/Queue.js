import Bee from 'bee-queue';

import redisConfig from '../config/redis';
import EnrollmentMail from '../app/jobs/EnrollmentMail';
import AnswerMail from '../app/jobs/AnswerMail';

const jobs = [EnrollmentMail, AnswerMail];

class Queue {
  constructor() {
    this.queues = {};
    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];
      bee.process(handle);
    });
  }
}

export default new Queue();
