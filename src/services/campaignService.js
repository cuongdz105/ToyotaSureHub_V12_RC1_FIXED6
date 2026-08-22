import {
  createCampaign as createFacebookCampaign,
  updateCampaign as updateFacebookCampaign,
  deleteCampaign as deleteFacebookCampaign,
  loadCampaigns,
} from "./facebookCampaignService";

export { loadCampaigns };
export function saveCampaigns(campaigns) {
  return Promise.all(campaigns.map((campaign) => updateFacebookCampaign(campaign.id, campaign)));
}
export function createCampaign(campaign) { return createFacebookCampaign(campaign); }
export function updateCampaign(updatedCampaign) { return updateFacebookCampaign(updatedCampaign.id, updatedCampaign); }
export function deleteCampaign(id) { return deleteFacebookCampaign(id); }
