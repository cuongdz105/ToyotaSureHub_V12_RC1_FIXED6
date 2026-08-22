import { reviewRules } from "./reviewRules";

export function reviewContent(text){

    const failed=[];

    reviewRules.forEach(rule=>{

        if(!rule.test(text)){

            failed.push(rule.message);

        }

    });

    return{

        passed:failed.length===0,

        failed

    };

}