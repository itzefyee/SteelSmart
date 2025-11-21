declare module 'opencascade.js' {
  type OpenCascadeInit = () => Promise<any>;
  const initOpenCascade: OpenCascadeInit;
  export default initOpenCascade;
}

