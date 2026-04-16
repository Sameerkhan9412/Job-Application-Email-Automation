type Job = () => Promise<void>;

class SimpleQueue {
  private queue: Job[] = [];
  private running = false;

  add(job: Job) {
    this.queue.push(job);
    this.run();
  }

  private async run() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        await job();
      }
    }

    this.running = false;
  }
}

export const emailQueue = new SimpleQueue();