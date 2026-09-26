import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

let cachedDepartments: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000;

export const getDepartments = asyncHandler(async (req: Request, res: Response) => {
  const now = Date.now();
  if (cachedDepartments && now - lastFetchTime < CACHE_TTL_MS) {
    res.status(200).json({
      success: true,
      data: cachedDepartments,
    });
    return;
  }

  const departments = await prisma.department.findMany({
    where: { active: true },
    include: {
      _count: {
        select: { employees: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  cachedDepartments = departments;
  lastFetchTime = now;

  res.status(200).json({
    success: true,
    data: departments,
  });
});
