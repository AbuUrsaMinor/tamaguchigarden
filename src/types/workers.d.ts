/// <reference types="vite/client" />

declare module '*.ts?worker' {
    const workerConstructor: {
        new(): Worker
    }
    export default workerConstructor
}
