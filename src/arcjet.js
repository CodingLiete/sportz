import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";
import { isSpoofedBot } from "@arcjet/inspect";

const arcjetKey = process.env.ARCJET_KEY;

const configuredMode = process.env.ARCJET_MODE ?? "LIVE";

if (configuredMode !== "LIVE" && configuredMode !== "DRY_RUN") {
    throw new Error("ARCJET_MODE must be LIVE or DRY_RUN");
}

const arcjetMode = configuredMode;

if (!arcjetKey) {
    throw new Error("ARCJET_KEY environment variable is missing");
}

export const httpArcjet = arcjet({
    key: arcjetKey,
    rules: [
        shield({ mode: arcjetMode }),
        detectBot({
            mode: arcjetMode,
            allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"]
        }),
        slidingWindow({
            mode: arcjetMode,
            interval: "10s",
            max: 50
        })
    ]
});

export const wsArcjet = arcjet({
    key: arcjetKey,
    rules: [
        shield({ mode: arcjetMode }),
        detectBot({
            mode: arcjetMode,
            allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"]
        }),
        slidingWindow({
            mode: arcjetMode,
            interval: "2s",
            max: 5
        })
    ]
});

export function securityMiddleware() {
    return async (req, res, next) => {
        try {
            const decision = await httpArcjet.protect(req);

            const hasSpoofedBot = decision.results.some(isSpoofedBot);
 
            if (hasSpoofedBot) {
                return res.status(403).json({
                    error: "Forbidden."
                });
            }

            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({
                        error: "Too many requests."
                    });
                }

                return res.status(403).json({
                    error: "Forbidden."
                });
            }

            next();
        } catch (e) {
            console.error("Arcjet middleware error", e);

            return res.status(503).json({
                error: "Service Unavailable"
            });
        }
    };
}