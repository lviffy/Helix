import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const contracts = ['AgentRegistry', 'Escrow', 'IntentStorage', 'Reputation', 'Settlement', 'Treasury'];
const outDir = join(__dirname, './out');

for (const name of contracts) {
  try {
    const jsonPath = join(outDir, `${name}.sol`, `${name}.json`);
    const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
    
    const abi = data.abi;
    const bytecode = data.bytecode.object;
    
    writeFileSync(join(outDir, `${name}.abi`), JSON.stringify(abi, null, 2));
    writeFileSync(join(outDir, `${name}.bin`), bytecode);
    console.log(`✅ Extracted ${name} ABI and BIN!`);
  } catch (err: any) {
    console.error(`❌ Failed to extract ${name}:`, err.message);
  }
}
