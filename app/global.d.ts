declare module "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.6.2/dist/browser/+esm" {
    export const DefaultRubyVM: {
        create: () => Promise<any>; // ここで必要なメソッドの型を定義
    };
}
