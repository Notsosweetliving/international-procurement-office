export const savedSearchAlert = (name: string, count: number) => ({
  subject: `${count} new IPO opportunities`,
  text: `Your saved search “${name}” has ${count} new matching opportunities. Sign in to review them.`,
});
export const deadlineReminder = (title: string, days: number) => ({
  subject: `${title} closes in ${days} day${days === 1 ? "" : "s"}`,
  text: `Review the Bid Workspace and official notice before the deadline.`,
});
