const travelStage = document.querySelector('.travel-stage');
const globeSurface = document.querySelector('.globe-surface');
const globeElement = document.querySelector('#travel-globe');
const gallery = document.querySelector('.travel-gallery');
const galleryTitle = document.querySelector('#gallery-title');
const galleryImage = document.querySelector('#gallery-image');
const galleryLink = document.querySelector('#gallery-image-link');
const galleryCount = document.querySelector('#gallery-count');
const previousPhoto = document.querySelector('#gallery-previous');
const nextPhoto = document.querySelector('#gallery-next');
const rotateButton = document.querySelector('#globe-rotate');
const markerChoices = document.querySelector('#marker-choices');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let selectedDestination;
let photoIndex = 0;
let returnFocus;
let globe;

function markerColor(destination) {
  if (destination.country === 'United States') {
    return !gallery.hidden && destination.id === selectedDestination.id ? '#b4fff1' : '#4de0c4';
  }
  return !gallery.hidden && destination.id === selectedDestination.id ? '#f8ce68' : '#f58e75';
}

function chooseMarker(event) {
  const bounds = globeElement.getBoundingClientRect();
  const camera = globe.camera().position;
  const nearby = travelDestinations.filter(candidate => {
    const surface = globe.getCoords(candidate.latitude, candidate.longitude);
    const visible = surface.x * camera.x + surface.y * camera.y + surface.z * camera.z > globe.getGlobeRadius() ** 2;
    const screen = globe.getScreenCoords(candidate.latitude, candidate.longitude, 0.015);
    return visible && Math.hypot(screen.x - (event.clientX - bounds.left), screen.y - (event.clientY - bounds.top)) <= 18;
  });
  markerChoices.hidden = true;
  if (nearby.length === 1) selectDestination(nearby[0]);
  if (nearby.length > 1) {
    globe.controls().autoRotate = false;
    rotateButton.setAttribute('aria-pressed', 'false');
    const options = document.querySelector('#marker-options');
    options.replaceChildren();
    nearby.forEach(candidate => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = candidate.label;
      button.addEventListener('click', () => selectDestination(candidate));
      options.append(button);
    });
    markerChoices.hidden = false;
    options.firstElementChild.focus({ preventScroll: true });
  }
}

function showPhoto() {
  const photo = selectedDestination.photos[photoIndex];
  galleryImage.src = photo;
  galleryImage.alt = `${selectedDestination.label}, ${selectedDestination.country}`;
  galleryLink.href = photo;
  galleryCount.textContent = `${photoIndex + 1} / ${selectedDestination.photos.length}`;
  previousPhoto.disabled = nextPhoto.disabled = selectedDestination.photos.length === 1;
}

function selectDestination(destination, trigger, focusGallery = true) {
  selectedDestination = destination;
  returnFocus = trigger;
  markerChoices.hidden = true;
  photoIndex = destination.photos.indexOf(destination.coverPhoto);
  galleryTitle.textContent = destination.label;
  document.querySelector('#gallery-country').textContent = destination.country;
  gallery.hidden = false;
  travelStage.hidden = false;
  travelStage.classList.remove('gallery-closed');
  document.querySelectorAll('[data-destination] summary').forEach(summary => {
    summary.setAttribute('aria-expanded', String(summary.parentElement.dataset.destination === destination.id));
    summary.classList.toggle('selected', summary.parentElement.dataset.destination === destination.id);
  });
  showPhoto();
  if (globe && !reducedMotion.matches) {
    globe.controls().autoRotate = false;
    rotateButton.setAttribute('aria-pressed', 'false');
    globe.pointOfView({ lat: destination.latitude, lng: destination.longitude, altitude: 1.9 }, 900);
    globe.pointColor(markerColor);
  }
  if (focusGallery) {
    galleryTitle.focus({ preventScroll: true });
    gallery.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
  }
}

function closeGallery() {
  gallery.hidden = true;
  travelStage.classList.add('gallery-closed');
  if (globeSurface.hidden) travelStage.hidden = true;
  document.querySelectorAll('[data-destination] summary').forEach(summary => {
    summary.setAttribute('aria-expanded', 'false');
    summary.classList.remove('selected');
  });
  markerChoices.hidden = true;
  if (globe) globe.pointColor(markerColor);
  const focusTarget = returnFocus || document.querySelector(globeSurface.hidden
    ? `[data-destination="${selectedDestination.id}"] summary`
    : '#globe-reset');
  focusTarget.focus({ preventScroll: true });
}

function changePhoto(direction) {
  photoIndex = (photoIndex + direction + selectedDestination.photos.length) % selectedDestination.photos.length;
  showPhoto();
}

document.querySelectorAll('[data-destination] summary').forEach(summary => {
  summary.setAttribute('aria-controls', 'travel-gallery');
  summary.setAttribute('aria-expanded', 'false');
  summary.addEventListener('click', event => {
    event.preventDefault();
    const destination = travelDestinations.find(destination => destination.id === summary.parentElement.dataset.destination);
    selectDestination(destination, summary);
  });
});
document.querySelector('#gallery-close').addEventListener('click', closeGallery);
document.querySelector('#marker-choices-close').addEventListener('click', () => {
  markerChoices.hidden = true;
  document.querySelector('#globe-reset').focus({ preventScroll: true });
});
previousPhoto.addEventListener('click', () => changePhoto(-1));
nextPhoto.addEventListener('click', () => changePhoto(1));
gallery.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    changePhoto(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !markerChoices.hidden) {
    markerChoices.hidden = true;
    document.querySelector('#globe-reset').focus({ preventScroll: true });
    return;
  }
  if (event.key === 'Escape' && !gallery.hidden) closeGallery();
});

if (window.lucide) window.lucide.createIcons();
document.body.classList.add('travel-enhanced');
selectDestination(travelDestinations.find(destination => destination.id === 'granada'), null, false);

if (!reducedMotion.matches && window.Globe) {
  try {
    globeSurface.hidden = false;
    globe = new Globe(globeElement, { rendererConfig: { antialias: true, alpha: true, preserveDrawingBuffer: true } })
      .width(globeSurface.clientWidth)
      .height(globeSurface.clientHeight)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('img/travel-earth.jpg')
      .showAtmosphere(true)
      .atmosphereColor('#aacabd')
      .atmosphereAltitude(0.12)
      .pointsData(travelDestinations)
      .pointLat('latitude')
      .pointLng('longitude')
      .pointAltitude(0.015)
      .pointRadius(0.65)
      .pointColor(markerColor)
      .pointLabel(destination => `${destination.label} &middot; ${destination.photos.length}`)
      .onPointHover(destination => { globeElement.style.cursor = destination ? 'pointer' : 'grab'; });
    globe.pointOfView({ lat: 25, lng: 15, altitude: 2.1 }, 0);
    globe.controls().enablePan = false;
    globe.controls().minDistance = 125;
    globe.controls().maxDistance = 500;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().addEventListener('start', () => {
      globe.controls().autoRotate = false;
      rotateButton.setAttribute('aria-pressed', 'false');
    });
    new ResizeObserver(() => {
      if (!globeSurface.hidden) globe.width(globeSurface.clientWidth).height(globeSurface.clientHeight);
    }).observe(globeSurface);
    const canvas = globeElement.querySelector('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    let pointerOrigin;
    let pointerWasClick = false;
    canvas.addEventListener('pointerdown', event => {
      pointerWasClick = false;
      pointerOrigin = event.isPrimary && event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
    });
    canvas.addEventListener('pointermove', event => {
      if (pointerOrigin && Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y) > 8) pointerOrigin = null;
    });
    canvas.addEventListener('pointerup', event => {
      pointerWasClick = Boolean(pointerOrigin);
      pointerOrigin = null;
    });
    canvas.addEventListener('click', event => {
      if (pointerWasClick) chooseMarker(event);
      pointerWasClick = false;
    });
    canvas.addEventListener('pointercancel', () => { pointerOrigin = null; });
    globeElement.addEventListener('webglcontextlost', () => {
      globe.pauseAnimation();
      globeSurface.hidden = true;
      travelStage.classList.add('without-globe');
    }, true);
  } catch {
    globeSurface.hidden = true;
    globeElement.replaceChildren();
    globe = undefined;
  }
}

travelStage.classList.toggle('without-globe', globeSurface.hidden);
document.querySelector('#globe-zoom-in').addEventListener('click', () => {
  globe.pointOfView({ altitude: Math.max(0.3, globe.pointOfView().altitude * 0.75) }, 300);
});
document.querySelector('#globe-zoom-out').addEventListener('click', () => {
  globe.pointOfView({ altitude: Math.min(4, globe.pointOfView().altitude / 0.75) }, 300);
});
document.querySelector('#globe-reset').addEventListener('click', () => {
  globe.pointOfView({ lat: 25, lng: 15, altitude: 2.1 }, 700);
});
rotateButton.addEventListener('click', () => {
  globe.controls().autoRotate = !globe.controls().autoRotate;
  rotateButton.setAttribute('aria-pressed', String(globe.controls().autoRotate));
});
reducedMotion.addEventListener('change', () => {
  if (globe) {
    globe.controls().autoRotate = false;
    rotateButton.setAttribute('aria-pressed', 'false');
    globeSurface.hidden = reducedMotion.matches;
    travelStage.classList.toggle('without-globe', reducedMotion.matches);
    if (reducedMotion.matches) globe.pauseAnimation();
    else globe.resumeAnimation();
    travelStage.hidden = globeSurface.hidden && gallery.hidden;
  }
});