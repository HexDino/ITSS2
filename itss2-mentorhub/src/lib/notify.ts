import { prisma } from './db';

type NotifyInput = {
  recipientId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
};

export async function createNotification(input: NotifyInput) {
  try {
    await prisma.notification.create({ data: input });
  } catch (err) {
    console.error('[notify] failed', err);
  }
}
