export function downloadArrayBuffer(
  data: string,
  fileName: string,
  mimeType = 'text/plain;charset=utf-8',
) {
  // 1. Convert the ArrayBuffer into a Blob
  const blob = new Blob([data], { type: mimeType });

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

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function promptForFile(accept = 'image/*'): Promise<File | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    input.onchange = (event: Event) => {
      const t = event?.target as HTMLInputElement;
      const file = t?.files?.[0];
      if (file) {
        resolve(file);
      } else {
        console.error('promptForFile: No file selected');
        reject(null);
      }
    };

    input.click();
  });
}