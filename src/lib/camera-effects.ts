/** Android-style negative: invert RGB, retain the alpha channel. */
export function invertPhotoPixels(data: Uint8ClampedArray) {
 for(let i=0;i<data.length;i+=4){data[i]=255-data[i];data[i+1]=255-data[i+1];data[i+2]=255-data[i+2];}
 return data;
}
