import { NextRequest, NextResponse } from "next/server";
import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/node";

export async function POST(request: NextRequest) {
    // GET /api/users リクエストの処理
    const params = await request.json();
    const script = params.script
    const response = await fetch("http://localhost:3000/ruby.wasm"); // ローカルのWASMファイルを指定
    const wasmArrayBuffer = await response.arrayBuffer();
    const module = await WebAssembly.compile(wasmArrayBuffer);
    const rubyVm = await DefaultRubyVM(module);
    rubyVm.vm.eval('require "stringio"');
    rubyVm.vm.eval('$stdout = StringIO.new');
    rubyVm.vm.eval(script);
    const result = rubyVm.vm.eval(`$stdout.string`).toString();
    rubyVm.vm.eval('$stdout = STDOUT');
    console.log(result);
    return NextResponse.json({result})
}