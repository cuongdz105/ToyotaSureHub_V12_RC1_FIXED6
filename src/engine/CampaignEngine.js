import {
    createCampaign,
    updateCampaign,
    loadCampaigns,
} from "../services/campaignService";

const CampaignEngine = {

    start(carId) {

        const campaign = {
            id: crypto.randomUUID(),
            carId,
            status: "running",
            currentStep: 0,
            progress: 0,
            createdAt: Date.now(),
        };

        createCampaign(campaign);

        return campaign;
    },

    finish(campaign) {

        campaign.status = "finished";
        campaign.progress = 100;

        updateCampaign(campaign);

        return campaign;
    },

    getAll() {
        return loadCampaigns();
    }

};

export default CampaignEngine;