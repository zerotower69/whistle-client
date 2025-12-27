declare module 'mine-type' {
  const mineType: {
    getContentType(extension: string): string;
    getFileType(contentType: string): string[];
  };
  export default mineType;
}
