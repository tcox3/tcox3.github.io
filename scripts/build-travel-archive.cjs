const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const manifest = fs.readFileSync(path.join(root, 'travel-data.js'), 'utf8');
const destinations = vm.runInNewContext(`${manifest}; travelDestinations`);
const archive = destinations.map(destination => {
  const photos = destination.photos.map(photo =>
    `            <a href="${photo}"><img src="${photo}" alt="${destination.label}, ${destination.country}" loading="lazy" decoding="async" width="800" height="600" /></a>`
  ).join('\n');
  return `        <details data-destination="${destination.id}">
          <summary>${destination.label}<span>${destination.country} &middot; ${destination.photos.length} ${destination.photos.length === 1 ? 'photo' : 'photos'}</span></summary>
          <div class="destination-photos">
${photos}
          </div>
        </details>`;
}).join('\n');

const pagePath = path.join(root, 'travel.html');
const page = fs.readFileSync(pagePath, 'utf8')
  .replace(/<!-- TRAVEL_ARCHIVE_START -->[\s\S]*?<!-- TRAVEL_ARCHIVE_END -->/,
    `<!-- TRAVEL_ARCHIVE_START -->\n${archive}\n        <!-- TRAVEL_ARCHIVE_END -->`);
fs.writeFileSync(pagePath, page);