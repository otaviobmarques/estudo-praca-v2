// Cria o primeiro administrador. A senha é lida do terminal (sem eco) e nunca aparece em log.
// Uso: npm run admin:criar -- <usuario> <email> "<Nome>"
import pg from "pg"; import { hash } from "@node-rs/argon2"; import readline from "node:readline";
const [usuario, email, nome] = process.argv.slice(2);
if (!usuario || !email || !nome) { console.error("Uso: npm run admin:criar -- <usuario> <email> \"<Nome>\""); process.exit(1); }
const senha = process.env.SENHA_ADMIN ?? await new Promise((ok) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = () => {}; process.stdout.write("Senha (mín. 12 caracteres): "); rl.question("", (s) => { rl.close(); process.stdout.write("\n"); ok(s); });
});
if (senha.length < 12) { console.error("Senha curta demais."); process.exit(1); }
const c = new pg.Client({ connectionString: process.env.DATABASE_URL }); await c.connect();
await c.query("insert into usuarios(nome,usuario,email,senha_hash,papel) values($1,$2,$3,$4,'administrador') on conflict (usuario) do update set senha_hash=excluded.senha_hash, papel='administrador', ativo=true",
  [nome, usuario.toLowerCase(), email.toLowerCase(), await hash(senha, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 })]);
console.log("Administrador pronto:", usuario); await c.end();
