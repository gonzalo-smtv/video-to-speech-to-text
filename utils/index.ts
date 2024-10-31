// @ts-ignore
const blobToBase64 = (blob, callback) => {
  const reader = new FileReader();
  reader.onload = function () {
    // @ts-ignore
    const base64data = reader?.result?.split(",")[1];
    callback(base64data);
  };
  reader.readAsDataURL(blob);
};

export { blobToBase64 };
