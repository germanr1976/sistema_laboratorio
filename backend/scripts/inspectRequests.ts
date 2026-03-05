import { PrismaClient } from '@prisma/client';

(async () => {
    const prisma = new PrismaClient();
    const list = await prisma.studyRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
    });
    console.log(list.map(r => ({ id: r.id, status: r.status, convertedStudyId: r.convertedStudyId })));
    await prisma.$disconnect();
})();
