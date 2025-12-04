// src/services/profilePageService.js
import { getProfileOverview } from "./profileOverviewService";
import { getEnrichedActivityForUser } from "./userActivityService";
import { getUserContributions } from "./contributionsService";

/**
 * Charge tout ce qu'il faut pour la page Profil
 */
export async function loadFullProfilePage(userId) {
  const [overview, contributions, activity] = await Promise.all([
    getProfileOverview(userId),
    getUserContributions(userId),
    getEnrichedActivityForUser(userId),
  ]);

  return {
    overview,
    contributions,
    activity,
  };
}
