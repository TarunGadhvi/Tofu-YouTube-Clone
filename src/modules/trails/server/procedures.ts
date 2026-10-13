import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc, getTableColumns } from "drizzle-orm";

import { db } from "@/db";
import {
  trails,
  trailSteps,
  trailEnrollments,
  trailStepProgress,
  users,
  videos
} from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const trailsRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        userId: z.string().uuid().nullish(),
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        }).nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { limit, userId } = input;

      const data = await db
        .select({
          ...getTableColumns(trails),
          user: users,
          stepCount: db.$count(trailSteps, eq(trailSteps.trailId, trails.id)),
        })
        .from(trails)
        .innerJoin(users, eq(trails.userId, users.id))
        .where(
          and(
            eq(trails.isPublished, true),
            userId ? eq(trails.userId, userId) : undefined
          )
        )
        .orderBy(desc(trails.updatedAt), desc(trails.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
          }
        : null;

      return {
        items,
        nextCursor,
      };
    }),

  getStudioMany: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        }).nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { limit } = input;

      const data = await db
        .select({
          ...getTableColumns(trails),
          user: users,
          stepCount: db.$count(trailSteps, eq(trailSteps.trailId, trails.id)),
        })
        .from(trails)
        .innerJoin(users, eq(trails.userId, users.id))
        .where(eq(trails.userId, userId))
        .orderBy(desc(trails.updatedAt), desc(trails.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            id: lastItem.id,
            updatedAt: lastItem.updatedAt,
          }
        : null;

      return {
        items,
        nextCursor,
      };
    }),

  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx;

      let userId;
      if (clerkUserId) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkUserId))
          .limit(1);
        if (dbUser) {
          userId = dbUser.id;
        }
      }

      const [trail] = await db
        .select({
          ...getTableColumns(trails),
          user: users,
          stepCount: db.$count(trailSteps, eq(trailSteps.trailId, trails.id)),
        })
        .from(trails)
        .innerJoin(users, eq(trails.userId, users.id))
        .where(eq(trails.id, input.id))
        .limit(1);

      if (!trail) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const steps = await db
        .select({
          ...getTableColumns(trailSteps),
          video: videos,
        })
        .from(trailSteps)
        .innerJoin(videos, eq(trailSteps.videoId, videos.id))
        .where(eq(trailSteps.trailId, trail.id))
        .orderBy(asc(trailSteps.position));

      let enrollment: typeof trailEnrollments.$inferSelect | null = null;
      let progress: (typeof trailStepProgress.$inferSelect)[] = [];

      if (userId) {
        const [existingEnrollment] = await db
          .select()
          .from(trailEnrollments)
          .where(
            and(
              eq(trailEnrollments.trailId, trail.id),
              eq(trailEnrollments.userId, userId)
            )
          )
          .limit(1);

        if (existingEnrollment) {
          enrollment = existingEnrollment;
          progress = await db
            .select()
            .from(trailStepProgress)
            .where(eq(trailStepProgress.enrollmentId, enrollment.id));
        }
      }

      return {
        ...trail,
        steps,
        enrollment,
        progress,
      };
    }),

  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const [trail] = await db
      .insert(trails)
      .values({
        title: "Untitled Trail",
        userId,
        isPublished: false,
      })
      .returning();

    return trail;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        thumbnailUrl: z.string().url().nullable().optional(),
        thumbnailKey: z.string().nullable().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id, ...values } = input;

      const [updated] = await db
        .update(trails)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(and(eq(trails.id, id), eq(trails.userId, userId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updated;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [removed] = await db
        .delete(trails)
        .where(and(eq(trails.id, input.id), eq(trails.userId, userId)))
        .returning();

      if (!removed) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return removed;
    }),

  createStep: protectedProcedure
    .input(
      z.object({
        trailId: z.string().uuid(),
        videoId: z.string().uuid(),
        title: z.string().optional(),
        checkpointQuestion: z.string().optional(),
        checkpointOptions: z.array(z.string()).optional(),
        correctOptionIndex: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [trail] = await db
        .select()
        .from(trails)
        .where(and(eq(trails.id, input.trailId), eq(trails.userId, userId)))
        .limit(1);

      if (!trail) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get highest position
      const existingSteps = await db
        .select({ position: trailSteps.position })
        .from(trailSteps)
        .where(eq(trailSteps.trailId, trail.id))
        .orderBy(desc(trailSteps.position))
        .limit(1);

      const nextPosition = existingSteps.length > 0 ? existingSteps[0].position + 1 : 0;

      const [step] = await db
        .insert(trailSteps)
        .values({
          trailId: trail.id,
          videoId: input.videoId,
          position: nextPosition,
          title: input.title,
          checkpointQuestion: input.checkpointQuestion,
          checkpointOptions: input.checkpointOptions,
          correctOptionIndex: input.correctOptionIndex,
        })
        .returning();

      return step;
    }),

  updateStep: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        checkpointQuestion: z.string().nullable().optional(),
        checkpointOptions: z.array(z.string()).nullable().optional(),
        correctOptionIndex: z.number().int().min(0).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id, ...values } = input;

      // Verify ownership via join
      const [step] = await db
        .select({
          step: trailSteps,
          trail: trails,
        })
        .from(trailSteps)
        .innerJoin(trails, eq(trailSteps.trailId, trails.id))
        .where(and(eq(trailSteps.id, id), eq(trails.userId, userId)))
        .limit(1);

      if (!step) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await db
        .update(trailSteps)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(eq(trailSteps.id, id))
        .returning();

      return updated;
    }),

  removeStep: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [step] = await db
        .select({
          step: trailSteps,
          trail: trails,
        })
        .from(trailSteps)
        .innerJoin(trails, eq(trailSteps.trailId, trails.id))
        .where(and(eq(trailSteps.id, input.id), eq(trails.userId, userId)))
        .limit(1);

      if (!step) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [removed] = await db
        .delete(trailSteps)
        .where(eq(trailSteps.id, input.id))
        .returning();

      return removed;
    }),

  enroll: protectedProcedure
    .input(z.object({ trailId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [trail] = await db
        .select()
        .from(trails)
        .where(eq(trails.id, input.trailId))
        .limit(1);

      if (!trail || !trail.isPublished) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existing] = await db
        .select()
        .from(trailEnrollments)
        .where(
          and(
            eq(trailEnrollments.trailId, trail.id),
            eq(trailEnrollments.userId, userId)
          )
        )
        .limit(1);

      if (existing) {
        return existing;
      }

      const [enrollment] = await db
        .insert(trailEnrollments)
        .values({
          trailId: trail.id,
          userId,
        })
        .returning();

      return enrollment;
    }),

  updateProgress: protectedProcedure
    .input(
      z.object({
        trailId: z.string().uuid(),
        stepId: z.string().uuid(),
        completed: z.boolean(),
        selectedOptionIndex: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      let [enrollment] = await db
        .select()
        .from(trailEnrollments)
        .where(
          and(
            eq(trailEnrollments.trailId, input.trailId),
            eq(trailEnrollments.userId, userId)
          )
        )
        .limit(1);

      if (!enrollment) {
        [enrollment] = await db
          .insert(trailEnrollments)
          .values({
            trailId: input.trailId,
            userId,
          })
          .returning();
      }

      const [step] = await db
        .select()
        .from(trailSteps)
        .where(eq(trailSteps.id, input.stepId))
        .limit(1);

      if (!step || step.trailId !== input.trailId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      let quizAnswered = false;
      if (step.checkpointQuestion !== null && step.correctOptionIndex !== null) {
        if (input.selectedOptionIndex === step.correctOptionIndex) {
          quizAnswered = true;
        } else if (input.completed) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Incorrect quiz answer",
          });
        }
      } else {
        quizAnswered = true;
      }

      const [existingProgress] = await db
        .select()
        .from(trailStepProgress)
        .where(
          and(
            eq(trailStepProgress.enrollmentId, enrollment.id),
            eq(trailStepProgress.stepId, step.id)
          )
        )
        .limit(1);

      let progressRecord;
      if (existingProgress) {
        [progressRecord] = await db
          .update(trailStepProgress)
          .set({
            completed: input.completed,
            quizAnswered,
            updatedAt: new Date(),
          })
          .where(eq(trailStepProgress.id, existingProgress.id))
          .returning();
      } else {
        [progressRecord] = await db
          .insert(trailStepProgress)
          .values({
            enrollmentId: enrollment.id,
            stepId: step.id,
            completed: input.completed,
            quizAnswered,
          })
          .returning();
      }

      // Check if all steps in trail are completed
      const allSteps = await db
        .select({ id: trailSteps.id })
        .from(trailSteps)
        .where(eq(trailSteps.trailId, input.trailId));

      const allProgress = await db
        .select()
        .from(trailStepProgress)
        .innerJoin(trailSteps, eq(trailStepProgress.stepId, trailSteps.id))
        .where(
          and(
            eq(trailStepProgress.enrollmentId, enrollment.id),
            eq(trailSteps.trailId, input.trailId),
            eq(trailStepProgress.completed, true)
          )
        );

      const isFullyCompleted = allSteps.length > 0 && allProgress.length === allSteps.length;

      if (isFullyCompleted !== enrollment.completed) {
        await db
          .update(trailEnrollments)
          .set({
            completed: isFullyCompleted,
            updatedAt: new Date(),
          })
          .where(eq(trailEnrollments.id, enrollment.id));
      }

      return progressRecord;
    }),
});
