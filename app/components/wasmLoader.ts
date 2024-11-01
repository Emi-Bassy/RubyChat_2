// import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/node";

// export async function loadWasm() {
//     const importObject = {
//         imports: {
//             imported_func: function(arg: any) {
//                 console.log(arg);
//             }
//         }
//     };  
//     const response = await fetch("http://localhost:3000/ruby.wasm"); // ローカルのWASMファイルを指定
//     const wasmArrayBuffer = await response.arrayBuffer();
//     const module = await WebAssembly.compile(wasmArrayBuffer);
//     const rubyVm = await DefaultRubyVM(module);
//     // const wasmModule = await WebAssembly.instantiate(wasmArrayBuffer, importObject);
//     // wasmModule.module
//     return rubyVm.vm;
// }