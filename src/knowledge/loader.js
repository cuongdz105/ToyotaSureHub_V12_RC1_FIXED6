import company from "./company/company.md?raw";
import sales from "./sales/sales.md?raw";

export function loadKnowledge() {

    return [
        company,
        sales,
    ].join("\n\n");

}