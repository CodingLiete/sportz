import { MATCH_STATUS } from "../validation/matches.js";

/**
 * Determines the current status of a match from its scheduled times.
 * @param {string|number|Date} startTime - The match start time.
 * @param {string|number|Date} endTime - The match end time.
 * @param {Date} [now=new Date()] - The time used to evaluate the status.
 * @return {string|null} The match status, or `null` if either time is invalid.
 */
export function getMatchStatus(startTime, endTime, now = new Date()) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if(Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    if(now < start) {
        return MATCH_STATUS.SCHEDULED;
    }

    if(now >= end) {
        return MATCH_STATUS.FINISHED;
    }

    return MATCH_STATUS.LIVE;
}

/**
 * Synchronize a match's status with its scheduled times.
 * @param {Object} match - The match whose status should be synchronized.
 * @param {Function} updateStatus - Callback invoked with the updated status.
 * @return {*} The match's current status.
 */
export async function syncMatchStatus(match, updateStatus) {
    const nextStatus = getMatchStatus(match.startTime, match.endTime);

    if(!nextStatus) {
        return match.status;
    }

    if(match.status !== nextStatus) {
        await updateStatus(nextStatus);
        match.status = nextStatus;
    }

    return match.status;
}