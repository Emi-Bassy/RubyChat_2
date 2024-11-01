// components/wasmLoader.js
export async function loadWasm() {
    const response = await fetch("https://cdn.jsdelivr.net/npm/@ruby/3.3-wasm-wasi@2.6.2/dist/ruby+stdlib.wasm"); // CDNからWASMを取得
    const wasmArrayBuffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(wasmArrayBuffer);
    return wasmModule.instance.exports; // WASMのエクスポートを返す
  }
  