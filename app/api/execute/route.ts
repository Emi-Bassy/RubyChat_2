import { NextRequest, NextResponse } from "next/server";
import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/node";
import * as fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
    // GET /api/users リクエストの処理
    const filePath = path.join(process.cwd(), 'public', 'ruby.wasm');
    const wasmBuffer = await fs.promises.readFile(filePath);

    const arrayBuffer = wasmBuffer.buffer.slice(wasmBuffer.byteOffset, wasmBuffer.byteOffset + wasmBuffer.byteLength);

    // WebAssembly.compile()にArrayBufferを渡す
    const module = await WebAssembly.compile(arrayBuffer);

    // const url = request.url;
    // const origin = new URL(url).origin;
    let result = '';
    const params = await request.json();
    const script = params.script
    // const response = await fetch(`https://ruby-chat-2-m14yuhbur-emi-bassys-projects.vercel.app/ruby.wasm`); // ローカルのWASMファイルを指定
    // const wasmArrayBuffer = await response.arrayBuffer();
    // console.log(wasmArrayBuffer);
    // const module = await WebAssembly.compile(wasmArrayBuffer);
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