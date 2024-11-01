import { NextRequest, NextResponse } from "next/server";
import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/node";

export async function POST(request: NextRequest) {
    // GET /api/users リクエストの処理
    const url = request.url;
    const origin = new URL(url).origin;
    console.log(origin);
    let result = '';
    const params = await request.json();
    const script = params.script
    const response = await fetch(`${origin}/ruby.wasm`); // ローカルのWASMファイルを指定
    const wasmArrayBuffer = await response.arrayBuffer();
    const module = await WebAssembly.compile(wasmArrayBuffer);
    const rubyVm = await DefaultRubyVM(module);
    // rubyVm.vm.eval(`eval(${script})`)
    try {
        rubyVm.vm.eval('require "stringio"');
        rubyVm.vm.eval('$stdout = StringIO.new');
        rubyVm.vm.eval(`begin\n\t${script}\nrescue => e\n\tputs e.class\n\tputs e.message\n\tputs e.backtrace\nend\n`);
        result = rubyVm.vm.eval(`$stdout.string`).toString();
        rubyVm.vm.eval('$stdout = STDOUT');
    } catch (e: any) {
        result = e.message;
    }
    console.log(result);
    return NextResponse.json({result})
}