export async function loadChangeDetails(api, schemaSlug, entitySlug, changeId, targetObject, transformCallback) {
    if (changeId in targetObject) {
        return;
    }
    const details = await api.getChangeRequestDetails({
        schemaSlug: schemaSlug,
        changeId: changeId,
        entityIdOrSlug: entitySlug
    });
    if (transformCallback) {
        targetObject[changeId] = await transformCallback(details);
    } else {
        targetObject[changeId] = details;
    }
}


const fixed_headers = ['action', 'name', 'new_name', 'slug'];


export function sortChangeHeaders(x, y) {
    const xif = fixed_headers.includes(x);
    const yif = fixed_headers.includes(y);
    if ((xif && yif) || (!xif && !yif)) {
        // Both values are a fixed header or none are
        if (x < y) {
            return -1;
        } else {
            return 1;
        }
    } else if (xif) {
        // Only xif is a fixed header
        return -1;
    }
    // Only yif is a fixed header
    return 1;
}