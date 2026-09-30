// return a unique list of codes from ticketSites
export const getListCodeProy = (ticketSites) => {

    const codeMap = new Map();

    ticketSites.forEach(item => {
        codeMap.set(item.id_proyecto);
    });

    return Array.from(codeMap.keys()).join(",");

}

export const getListOCProy = (ticketSites) => {

    const ocMap = new Map();

    ticketSites.forEach(item => {
        ocMap.set(item.nro_oc);
    });

    return Array.from(ocMap.keys()).join(",");

}