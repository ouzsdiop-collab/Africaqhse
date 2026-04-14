/**
 * jsPDF référence `canvg` en import dynamique pour `addSvgAsImage` uniquement.
 * L’app n’utilise pas ce chemin (exports = html2canvas + raster). Alias Vite → évite ~160 ko.
 */
export function fromString() {
  return Promise.reject(
    new Error(
      'addSvgAsImage (canvg) non inclus dans ce build. Utilisez la capture HTML (html2canvas) ou une image raster.'
    )
  );
}

const stub = { fromString };
export default stub;
