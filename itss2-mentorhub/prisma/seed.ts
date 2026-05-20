/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  const pwd = await bcrypt.hash('password123', 10);

  const [admin, alice, bob, mentor1, employer1] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@itss.local' },
      update: {},
      create: { email: 'admin@itss.local', name: 'Admin', password: pwd, role: 'ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'alice@student.local' },
      update: {},
      create: { email: 'alice@student.local', name: 'Alice Nguyễn', password: pwd, role: 'STUDENT' },
    }),
    prisma.user.upsert({
      where: { email: 'bob@student.local' },
      update: {},
      create: { email: 'bob@student.local', name: 'Bob Trần', password: pwd, role: 'STUDENT' },
    }),
    prisma.user.upsert({
      where: { email: 'mentor1@itss.local' },
      update: {},
      create: { email: 'mentor1@itss.local', name: 'Linh Phạm', password: pwd, role: 'MENTOR' },
    }),
    prisma.user.upsert({
      where: { email: 'hr@fpt.local' },
      update: {},
      create: { email: 'hr@fpt.local', name: 'HR FPT', password: pwd, role: 'EMPLOYER' },
    }),
  ]);

  await prisma.studentProfile.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId: alice.id,
      university: 'Hanoi University of Science and Technology',
      major: 'Software Engineering',
      yearOfStudy: 3,
      skills: ['react', 'typescript', 'nodejs'],
      bio: 'Quan tâm tới fullstack web và DX.',
    },
  });
  await prisma.studentProfile.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId: bob.id,
      university: 'PTIT',
      major: 'Data Science',
      yearOfStudy: 2,
      skills: ['python', 'sql', 'pandas'],
    },
  });
  await prisma.mentorProfile.upsert({
    where: { userId: mentor1.id },
    update: {},
    create: {
      userId: mentor1.id,
      company: 'Money Forward',
      position: 'Senior Backend Engineer',
      yearsOfExperience: 6,
      expertise: ['golang', 'kubernetes', 'system design'],
      bio: 'Đang xây nền tảng fintech tại Tokyo. Sẵn lòng review CV & roadmap.',
      verified: true,
    },
  });

  const fpt = await prisma.company.upsert({
    where: { slug: 'fpt-software' },
    update: {},
    create: {
      name: 'FPT Software',
      slug: 'fpt-software',
      description: 'Công ty phần mềm hàng đầu Việt Nam.',
      industry: 'IT Services',
      location: 'Hà Nội',
      size: 'LARGE',
      verified: true,
    },
  });
  await prisma.employerProfile.upsert({
    where: { userId: employer1.id },
    update: {},
    create: { userId: employer1.id, companyId: fpt.id, title: 'Tech Recruiter' },
  });

  await prisma.job.upsert({
    where: { id: 'seed-job-1' },
    update: {},
    create: {
      id: 'seed-job-1',
      title: 'Frontend Intern (ReactJS)',
      description: '<p>Tham gia phát triển sản phẩm SaaS quốc tế.</p>',
      requirements: '<ul><li>Biết React</li><li>Hiểu Git</li></ul>',
      benefits: '<ul><li>Mentor 1-1</li><li>Trợ cấp</li></ul>',
      type: 'INTERNSHIP',
      status: 'OPEN',
      location: 'Hà Nội',
      tags: ['react', 'typescript'],
      companyId: fpt.id,
    },
  });

  const channels = [
    { name: 'Frontend & ReactJS', slug: 'frontend-react', category: 'FRONTEND' as const, tags: ['react', 'nextjs'] },
    { name: 'Backend & API Design', slug: 'backend-api', category: 'BACKEND' as const, tags: ['nodejs', 'postgresql'] },
    { name: 'DevOps & Cloud', slug: 'devops-cloud', category: 'DEVOPS' as const, tags: ['docker', 'k8s'] },
    { name: 'Career & Phỏng vấn', slug: 'career', category: 'CAREER' as const, tags: ['interview', 'cv'] },
  ];
  for (const c of channels) {
    await prisma.channel.upsert({
      where: { slug: c.slug },
      update: { approved: true },
      create: { ...c, approved: true, description: `Thảo luận về ${c.name}.` },
    });
  }

  const reactChan = await prisma.channel.findUnique({ where: { slug: 'frontend-react' } });
  if (reactChan) {
    const thread = await prisma.thread.upsert({
      where: { id: 'seed-thread-1' },
      update: {},
      create: {
        id: 'seed-thread-1',
        title: 'Khi nào nên dùng Server Components vs Client Components?',
        content:
          '<p>Em đang học Next.js 15 và chưa rõ khi nào dùng RSC, khi nào dùng "use client". Anh chị tư vấn giúp em với ạ.</p>',
        channelId: reactChan.id,
        authorId: alice.id,
        tags: ['nextjs', 'react'],
      },
    });
    await prisma.answer.upsert({
      where: { id: 'seed-answer-1' },
      update: {},
      create: {
        id: 'seed-answer-1',
        threadId: thread.id,
        authorId: mentor1.id,
        isAnonymous: false,
        content:
          '<p>Mặc định ưu tiên RSC để giảm JS gửi xuống client. Chỉ chuyển sang Client khi cần hook (<code>useState</code>, <code>useEffect</code>) hoặc browser API.</p>',
      },
    });
    await prisma.answer.upsert({
      where: { id: 'seed-answer-2' },
      update: {},
      create: {
        id: 'seed-answer-2',
        threadId: thread.id,
        authorId: bob.id,
        isAnonymous: true,
        content: '<p>Mình từng học sai — đừng để mọi thứ là "use client" nhé, sẽ mất hết lợi ích streaming.</p>',
      },
    });
  }

  console.log('✅ Done. Login as alice@student.local / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
