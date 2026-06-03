export function toggleFullScreen(el: HTMLElement) {
  if (!document.fullscreenElement) {
    // If the document is not in full screen mode
    // make the video full screen
    el.requestFullscreen();
  } else {
    // Otherwise exit the full screen
    document.exitFullscreen?.();
  }
}

export function downloadArrayBuffer(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  mimeType = 'application/octet-stream',
) {
  // 1. Convert the ArrayBuffer into a Blob
  const blob = new Blob([arrayBuffer], { type: mimeType });

  // 2. Create a temporary object URL pointing to the Blob
  const url = window.URL.createObjectURL(blob);

  // 3. Create a hidden anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';

  // 4. Append to the DOM, trigger click, and cleanup
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url); // Free up memory
}
