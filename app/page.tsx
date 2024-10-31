import ClientWrapper from "./components/ClientWraper";
import { loadWasm }  from "./components/wasmLoader"

export default async function Home() {
  const wasm = await loadWasm() 
  return (
    <div className='container mx-auto p-4'>
      <ClientWrapper vm={wasm} />
    </div>
  )
}