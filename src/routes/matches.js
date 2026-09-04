import { Router } from 'express';
import { matches } from "../db/schema.js";
import { desc } from "drizzle-orm";
import { db } from "../db/db.js";
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { getMatchStatus } from '../utils/match-status.js';

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    
    if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: parsed.error.issues,
    });
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

  try {
    const data = await db
    .select()
    .from(matches)
    .orderBy((desc(matches.createdAt)))
    .limit(limit);

    res.json({ data: data });
  } catch (e) {
    console.error("DATABASE ERROR:", e);

    return res.status(500).json({
      error: "Failed to list matches",
      details: e instanceof Error ? e.message : String(e),
    });
  }
});

matchRouter.post("/", async (req, res) => {
  console.log("BODY:", req.body);

  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.issues,
    });
  }

  try {
    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(parsed.data.endTime);

    const status = getMatchStatus(startTime, endTime);

    const [event] = await db
      .insert(matches)
      .values({
        sport: parsed.data.sport,
        homeTeam: parsed.data.homeTeam,
        awayTeam: parsed.data.awayTeam,
        startTime: startTime,
        endTime: endTime,
        homeScore: parsed.data.homeScore ?? 0,
        awayScore: parsed.data.awayScore ?? 0,
        status: status,
      })
      .returning();

    if (res.app.locals.broadcastMatchCreated) {
      res.app.locals.broadcastMatchCreated(event);
    }

    return res.status(201).json({
      data: event,
    });
  } catch (e) {
    console.error("DATABASE ERROR:", e);

    return res.status(500).json({
      error: "Failed to create match",
      details: e instanceof Error ? e.message : String(e),
    });
  }
});