import type { CV } from "@/lib/cardScan/pipeline";

// Copied from @techstark/opencv-js by scripts/copy-opencv.mjs (postinstall).
// Bump the query when the package version changes so browsers fetch the new file.
const OPENCV_URL = "/vendor/opencv.js?v=4.12.0-release.1";

type CvGlobal = CV & {
  then?: (cb: (cv: CV) => void) => void;
  onRuntimeInitialized?: () => void;
};

let loading: Promise<CV> | undefined;

const globalCv = () => (window as unknown as { cv?: CvGlobal }).cv;

// Never pass `cv` to a Promise's resolve() before its `then` is removed: the module is a
// thenable whose then() calls back with itself, so the Promise would adopt it forever
// and lock up the main thread.
const waitForRuntime = (cv: CvGlobal) =>
  new Promise<CV>((resolve) => {
    if (typeof cv.then === "function") {
      // The module is a thenable that resolves to itself; drop `then` before resolving,
      // otherwise Promise resolution would recurse forever.
      cv.then((ready) => {
        delete (ready as { then?: unknown }).then;
        resolve(ready);
      });
    } else if (typeof cv.Mat === "function") {
      resolve(cv);
    } else {
      cv.onRuntimeInitialized = () => resolve(cv);
    }
  });

/**
 * Loads OpenCV.js (WebAssembly) in the browser from the app's own origin,
 * so nothing is fetched from third parties at run time.
 */
export const loadOpenCv = (): Promise<CV> => {
  loading ??= new Promise<void>((resolve, reject) => {
    if (globalCv()) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = OPENCV_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${OPENCV_URL}`));
    document.head.appendChild(script);
  })
    .then(() => {
      const cv = globalCv();
      if (!cv) throw new Error("OpenCV.js loaded but `cv` is not defined");
      return waitForRuntime(cv);
    })
    .catch((e) => {
      loading = undefined;
      throw e;
    });
  return loading;
};
