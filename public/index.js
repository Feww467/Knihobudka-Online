let leafletMap = null;
let allBookcases = [];
let markerLayer = null;
let debounceTimer;

async function fetchBookcases() {
    try {
        const res = await fetch("export.geojson");
        const geojson = await res.json();
        allBookcases = geojson.features
            .filter(f => f.geometry?.coordinates)
            .map(f => ({
                lon: f.geometry.coordinates[0],
                lat: f.geometry.coordinates[1],
                tags: f.properties
            }));
        updateMarkers(leafletMap);
    } catch (e) {
        console.warn('Failed to load bookcases:', e);
    }
}

function updateMarkers(leafletMap) {
    // clear previous markers
    if (markerLayer) {
        markerLayer.clearLayers();
    } else {
        markerLayer = L.layerGroup().addTo(leafletMap);
    }

    const bounds = leafletMap.getBounds();
    allBookcases
        .filter(node => bounds.contains([node.lat, node.lon]))
        .forEach(node => {
          const name = node.tags?.name || 'Knihobudka';
          const capacity = node.tags?.capacity ? `<br>Kapacita: ${node.tags.capacity}` : '<br>Neznámá kapacita';
          const osmLink = `<a href="/bookcase?id=${node.tags?.['@id']?.split('/')[1]}&title=${name}">${name}</a>`
            L.marker([node.lat, node.lon])
                .addTo(markerLayer)
                .bindPopup(`${osmLink}${capacity}`);
        });
}