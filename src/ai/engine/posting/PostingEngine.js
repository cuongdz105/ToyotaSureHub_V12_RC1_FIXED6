// =======================================
// ToyotaSureHub Posting Engine
// =======================================

import { loadGroups } from "../../../services/facebookGroupService";

const PostingEngine = {

    start(car) {

        const groups = loadGroups();

        return {

            car,

            ai: car.aiContent?.facebook || "",

            groups,

            progress: {

                total: groups.length,

                current: 0,

                completed: 0,

            },

            nextGroup: groups[0] || null,

        };

    },

    getNext(state) {

        if (state.progress.current >= state.groups.length) {

            return null;

        }

        return state.groups[state.progress.current];

    },

    complete(state) {

        const nextCurrent = state.progress.current + 1;

        return {

            ...state,

            progress: {

                ...state.progress,

                current: nextCurrent,

                completed: nextCurrent,

            },

            nextGroup:

                state.groups[nextCurrent] || null,

        };

    },

};

export default PostingEngine;