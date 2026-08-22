import company from "./company";
import humans from "./humans";
import forbidden from "./forbidden";
import facebook from "./facebook";
import humanLanguage from "./humanLanguage";


export function buildDNA(type) {

    let channel = "";

    if(type==="facebook"){
        channel = facebook;
    }

    return `
${company}

${humans}

${forbidden}

${channel}

${humanLanguage}
`;
}