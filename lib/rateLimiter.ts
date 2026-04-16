export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const rateLimiter = async (index: number) => {
  // 1.5 sec delay per email
  await delay(1500);

  // Optional: add stronger control
  if (index % 10 === 0) {
    await delay(3000); // pause after every 10 emails
  }
};