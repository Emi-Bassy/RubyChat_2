import { DefaultRubyVM } from "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.6.2/dist/browser/+esm";

export async function loadWasm() {
    const rubyVM = await DefaultRubyVM.create(); // Ruby VMのインスタンスを作成
    const response = await fetch("https://cdn.jsdelivr.net/npm/@ruby/3.3-wasm-wasi@2.6.2/dist/ruby+stdlib.wasm"); // CDNからWASMを取得
    const wasmArrayBuffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(wasmArrayBuffer, {
        env: rubyVM, // rubyVMをインポートとして追加
    });
    return {
        rubyVM,
        exports: wasmModule.instance.exports // WASMのエクスポートを返す
    } 
  }
  