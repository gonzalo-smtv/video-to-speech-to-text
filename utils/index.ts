// @ts-ignore
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      // @ts-ignore
      const base64data = reader?.result?.split(",")[1];
      resolve(base64data);
    };
    reader.onerror = function (error) {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};

export { blobToBase64 };
