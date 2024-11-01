export async function loadWasm() {
    const response = await fetch("./public/ruby.wasm"); // ローカルのWASMファイルを指定
    const wasmArrayBuffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(wasmArrayBuffer);
    return wasmModule.instance.exports; 
}